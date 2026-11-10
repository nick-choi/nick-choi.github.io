# NUnit
## TestCase 에 Object Parameter 처리

```c#
    private static IEnumerable<TestCaseData> GetTypes()
    {
        yield return new TestCaseData(Type.HIRE,
            new List<int>() { 1,2,3,4,5 }).SetName("HIRE_TEST");

        yield return new TestCaseData(Type.TOOL,
            new List<int>() { 1,3,5,7,9 }).SetName("TOOL_TEST");

        yield return new TestCaseData(Type.HOLD,
            new List<int>() { 2,4,6,8,10 }).SetName("HOLD_TEST");
    }

    [TestCaseSource(nameof(GetTypes))]
    public void Run_WithTypes_ReturnsExpected(Type choice,
        List<int> cashList)
    {
      ...
    }
```