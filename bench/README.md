# Usage

Compare the current branch against the default branch (`main`):
```
npm run bench:cmp -- current
```

Compare two branch, eg. `my-branch` against `other-branch`:
```
npm run bench:cmp -- my-branch other-branch 
```

If `bench:cmp` is executed without parameters, an interactive mode is enabled. The CLI will prompt to select:

- the feature branch
- the branch to compare against

```
npm run bench:cmp                             

> ultimate-express@2.0.13 bench:cmp
> node ./bench/bench-cmp-branch.js

Select the branch you want to compare (feature branch):
(x) FIX-CONTENT-TYPE-2
( ) array-jsonp
( ) async-error-handling-array
( ) bench-both-4-4
...
```

# What it does

- Checks out each branch sequentially
- Runs the existing npm run bench script
- Parses benchmark output
- Compares results scenario-by-scenario
- Prints percentage differences
- Highlights relevant changes:
    - Green → improvement greater than +5%
    - Red → regression worse than -5%
    - Neutral values are shown without color

At the end, it automatically switches back to the original branch.