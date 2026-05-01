---
tags: private
---

This is where you configure SilverBullet to your liking. See [[^Library/Std/Config]] for a full list of configuration options.

```space-lua
config.set {  
  ["std.widgets.toc.enabled"] = true,
  plugs = {
    "github:silverbulletmd/silverbullet-git/git.plug.js"
  },
  spaceLua = {
    trustedLinks = true,
    userScripts = true
  }
}
```
