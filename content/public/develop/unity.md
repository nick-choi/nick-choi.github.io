# ios 빌드시 cs 스크립트로 만들기
* 기본적으로 unity -> ios 빌드 -> 배포의 파이프라인을 이해하고 있어야 한다.
* chatgpt 짜준 코드(세상 많이 좋아짐)

```c#
#if UNITY_EDITOR_OSX && UNITY_IOS
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using Debug = UnityEngine.Debug;

// Place in Assets/Editor. Optional deployment uses Apple devicectl.
public sealed class IOSAutoBuilder : IPostprocessBuildWithReport
{
    private const string Scheme = "Unity-iPhone";
    private const string Configuration = "Release";
    // Optional: set IOS_DEVICE_UDID in the Unity process environment,
    // or enter the physical device UDID here. Empty uses a generic destination.
    private const string DeviceUdid = "";
    // Opt in explicitly. Environment variables can also enable these options.
    private const bool AutoInstall = true;
    private const bool AutoLaunch = true;
    public int callbackOrder => int.MaxValue;

    public void OnPostprocessBuild(BuildReport report)
    {
        if (report.summary.platform != BuildTarget.iOS)
            return;

        // This script produces a physical-device build, not a simulator build.
        if (PlayerSettings.iOS.sdkVersion != iOSSdkVersion.DeviceSDK)
            return;

        string projectDir = Path.GetFullPath(report.summary.outputPath)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        string artifactRoot = projectDir + "-IPA";
        string runDir = Path.Combine(artifactRoot,
            DateTime.UtcNow.ToString("yyyyMMdd-HHmmss-fff", CultureInfo.InvariantCulture)
            + "-" + Guid.NewGuid().ToString("N").Substring(0, 6));
        Directory.CreateDirectory(runDir);

        try
        {
            BuildIpa(projectDir, runDir);
        }
        catch (Exception ex)
        {
            throw new BuildFailedException(
                $"iOS build, packaging or deployment failed: {ex.Message}\nLogs: {runDir}");
        }
    }

    private static void BuildIpa(string projectDir, string runDir)
    {
        string teamId = PlayerSettings.iOS.appleDeveloperTeamID;
        if (string.IsNullOrWhiteSpace(teamId) ||
            !PlayerSettings.iOS.appleEnableAutomaticSigning)
            throw new InvalidOperationException(
                "Set Apple Developer Team ID and Automatically Sign in Unity iOS Player Settings.");

        string udid = Environment.GetEnvironmentVariable("IOS_DEVICE_UDID");
        if (string.IsNullOrWhiteSpace(udid)) udid = DeviceUdid;
        udid = udid.Trim();
        bool autoLaunch = AutoLaunch || IsEnabled("IOS_AUTO_LAUNCH");
        bool autoInstall = AutoInstall || IsEnabled("IOS_AUTO_INSTALL") || autoLaunch;
        if (autoInstall && string.IsNullOrWhiteSpace(udid))
            throw new InvalidOperationException(
                "Automatic deployment requires the target hardware UDID (IOS_DEVICE_UDID or DeviceUdid).");

        string workspace = Path.Combine(projectDir, "Unity-iPhone.xcworkspace");
        string project = Path.Combine(projectDir, "Unity-iPhone.xcodeproj");
        bool useWorkspace = Directory.Exists(workspace);
        if (!useWorkspace && !Directory.Exists(project))
            throw new DirectoryNotFoundException("Unity-iPhone.xcodeproj was not found.");

        string derivedData = Path.Combine(runDir, "DerivedData");
        var args = new System.Collections.Generic.List<string>
        {
            useWorkspace ? "-workspace" : "-project",
            useWorkspace ? workspace : project,
            "-scheme", Scheme,
            "-configuration", Configuration,
            "-sdk", "iphoneos",
            "-destination", string.IsNullOrEmpty(udid) ? "generic/platform=iOS" : "id=" + udid,
            "-derivedDataPath", derivedData,
            "-allowProvisioningUpdates",
            "DEVELOPMENT_TEAM=" + teamId,
            "CODE_SIGN_STYLE=Automatic"
        };
        if (!string.IsNullOrEmpty(udid))
            args.Add("-allowProvisioningDeviceRegistration");
        args.Add("build");

        Run("/usr/bin/xcodebuild", projectDir,
            Path.Combine(runDir, "xcodebuild.log"), args.ToArray());

        string products = Path.Combine(derivedData, "Build", "Products", Configuration + "-iphoneos");
        string[] apps = Directory.GetDirectories(products, "*.app", SearchOption.TopDirectoryOnly);
        if (apps.Length != 1)
            throw new InvalidOperationException($"Expected one .app in {products}; found {apps.Length}.");
        string app = apps[0];
        string profile = Path.Combine(app, "embedded.mobileprovision");
        if (!File.Exists(profile))
            throw new FileNotFoundException("Missing embedded provisioning profile.", profile);

        Run("/usr/bin/codesign", projectDir, Path.Combine(runDir, "codesign.log"),
            "--verify", "--deep", "--strict", "--verbose=2", app);

        // Check expiry and registered device coverage before packaging.
        string decoded = Path.Combine(runDir, "profile.tmp.plist");
        DateTimeOffset expiration;
        try
        {
            Run("/usr/bin/security", projectDir, Path.Combine(runDir, "provisioning.log"),
                "cms", "-D", "-i", profile, "-o", decoded);
            XElement dict = XDocument.Load(decoded).Root?.Element("dict");
            if (dict == null) throw new InvalidDataException("Invalid provisioning plist.");

            XElement date = GetPlistValue(dict, "ExpirationDate");
            if (date == null || !DateTimeOffset.TryParse(date.Value, CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal, out expiration))
                throw new InvalidDataException("Cannot read provisioning expiry.");
            if (expiration <= DateTimeOffset.UtcNow)
                throw new InvalidOperationException("The provisioning profile has expired.");

            XElement devices = GetPlistValue(dict, "ProvisionedDevices");
            if (devices == null || !devices.Elements("string").Any())
                throw new InvalidOperationException("Profile does not contain registered devices.");
            if (!string.IsNullOrEmpty(udid) && !devices.Elements("string").Any(
                    d => string.Equals(d.Value, udid, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException("Target UDID is not in the provisioning profile.");
        }
        finally
        {
            if (File.Exists(decoded)) File.Delete(decoded);
        }

        string appName = Path.GetFileName(app);
        string ipa = Path.Combine(runDir, Path.GetFileNameWithoutExtension(appName) + ".ipa");
        string temporaryIpa = ipa + ".tmp";
        string payload = Path.Combine(runDir, "Payload");
        Directory.CreateDirectory(payload);
        Run("/usr/bin/ditto", projectDir, Path.Combine(runDir, "copy.log"),
            app, Path.Combine(payload, appName));
        Run("/usr/bin/ditto", projectDir, Path.Combine(runDir, "package.log"),
            "-c", "-k", "--keepParent", payload, temporaryIpa);
        Run("/usr/bin/unzip", projectDir, Path.Combine(runDir, "zip-check.log"),
            "-tq", temporaryIpa);
        File.Move(temporaryIpa, ipa);
        Directory.Delete(payload, true);

        Debug.Log($"[iOS] IPA: {ipa}\nProvisioning expires (UTC): {expiration.UtcDateTime:yyyy-MM-dd HH:mm:ss}\nLogs: {runDir}");

        if (autoInstall)
        {
            Run("/usr/bin/xcrun", projectDir, Path.Combine(runDir, "device-install.log"),
                "devicectl", "device", "install", "app", "--device", udid, app);
            Debug.Log($"[iOS] Installed on {udid}");

            if (autoLaunch)
            {
                string bundleIdFile = Path.Combine(runDir, "bundle-id.txt");
                Run("/usr/bin/plutil", projectDir, Path.Combine(runDir, "bundle-id.log"),
                    "-extract", "CFBundleIdentifier", "raw", "-o", bundleIdFile,
                    Path.Combine(app, "Info.plist"));
                string bundleId = File.ReadAllText(bundleIdFile).Trim();
                if (string.IsNullOrWhiteSpace(bundleId))
                    throw new InvalidDataException("Missing CFBundleIdentifier.");
                Run("/usr/bin/xcrun", projectDir, Path.Combine(runDir, "device-launch.log"),
                    "devicectl", "device", "process", "launch", "--device", udid, bundleId);
                Debug.Log($"[iOS] Launched {bundleId} on {udid}");
            }
        }
    }

    private static bool IsEnabled(string name)
    {
        string value = Environment.GetEnvironmentVariable(name);
        return value == "1" || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
    }

    private static XElement GetPlistValue(XElement dict, string key)
    {
        return dict.Elements("key").FirstOrDefault(k => k.Value == key)
            ?.ElementsAfterSelf().FirstOrDefault();
    }

    // Quote every argument for ProcessStartInfo.Arguments; no shell is involved.
    private static string Quote(string value)
    {
        return "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }

    private static void Run(string executable, string workingDir, string logPath, params string[] args)
    {
        Debug.Log($"[iOS] {Path.GetFileName(executable)} → {logPath}");
        var info = new ProcessStartInfo
        {
            FileName = executable,
            Arguments = string.Join(" ", args.Select(Quote)),
            WorkingDirectory = workingDir,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        using (var writer = new StreamWriter(logPath, false, new UTF8Encoding(false)))
        using (var process = new Process { StartInfo = info })
        {
            writer.AutoFlush = true;
            writer.WriteLine(executable + " " + info.Arguments);
            var gate = new object();
            void Write(string line)
            {
                if (line == null) return;
                lock (gate) writer.WriteLine(line);
            }
            process.OutputDataReceived += (_, e) => Write(e.Data);
            process.ErrorDataReceived += (_, e) => Write(e.Data);
            if (!process.Start()) throw new InvalidOperationException("Cannot start " + executable);
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            process.WaitForExit();
            if (process.ExitCode != 0)
                throw new InvalidOperationException(
                    $"{Path.GetFileName(executable)} exited with {process.ExitCode}. See {logPath}");
        }
    }
}
#endif
```