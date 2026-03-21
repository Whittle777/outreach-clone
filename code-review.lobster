{
  "pipeline": "CodeReviewAndRepair",
  "description": "Orchestrator plans architecture, Coder implements, and loops on test failures.",
  "loop": {
    "maxIterations": 3,
    "exitCondition": "{{ExecuteTests.exitCode}} == 0"
  },
  "steps": [
    {
      "name": "Plan",
      "action": "openclaw.invoke",
      "params": {
        "target": "orchestrator",
        "system": "You are a Senior Staff Engineer. Review the user request and output a strict step-by-step implementation plan. Do not write the code yourself.",
        "prompt": "User Request: {{input}}"
      }
    },
    {
      "name": "WriteCode",
      "action": "openclaw.invoke",
      "params": {
        "target": "primary",
        "system": "You are a 10x developer. Follow the Orchestrator's plan exactly. Modify the files in the workspace as needed.",
        "prompt": "Orchestrator Plan: {{Plan.output}}\n\nPrevious Errors (if any): {{ExecuteTests.stderr}}"
      }
    },
    {
      "name": "ExecuteTests",
      "action": "system.run",
      "params": {
        "command": "npm test", 
        "cwd": "/Users/Henry.Whittle/outreach-clone",
        "captureOutput": true
      }
    }
  ],
  "output": {
    "success": "Code implemented and passed tests successfully.",
    "failure": "Max iterations reached. Last error: {{ExecuteTests.stderr}}"
  }
}