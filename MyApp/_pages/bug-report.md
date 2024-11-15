---
title: Creating a good Bug Report
---

### [View existing Issues](https://github.com/litdb/litdb/issues) or [Report a New Issue](https://github.com/litdb/litdb/issues/new?template=bug_report.yml)

> Issues must be reproducible with either a failing test, sample code, gist, link to a stand-alone project 
or otherwise clear steps to reproduce the issue. For details please see 
[How to create a Minimal, Complete, and Verifiable example](http://stackoverflow.com/help/mcve).


The more effective your bug report is, the better chance it will get fixed. So fixing a bug depends on how
well it's reported.

## 1) Reproducible:

If your bug is not reproducible it will never get fixed. You should clearly **provide the steps to reproduce the bug**.
Do not assume or skip any reproducing step. A Step-by-step description of the issue is easy to reproduce and fix.
E.g. **A failing test** with the issue (or in a gist) is the preferred way to report a reproducible error as it contains
all the assumptions and environment settings necessary for the error to occur.

## 2) Be Specific:

Do not write a essay about the problem. Be Specific and to the point. Try to summarize the problem in minimum
words yet in effective way. Do not combine multiple problems even they seem to be similar.
Write different reports for each problem.

## 3) Environment Details:

Ensure you're using the latest litdb packages, include the Operating System and the versions of the relevant
major components, e.g. JS Runtime (Node.js, Bun, Deno), etc. If you're using a browser, mention the browser and its version.