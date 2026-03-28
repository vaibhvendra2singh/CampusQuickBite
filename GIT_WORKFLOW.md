# Git Commit Workflow Cheatsheet

Here are the basic steps on how to commit your changes using the terminal.

## Step 1: Check your modified files
This command securely shows you a list of which files you've changed, which ones have been added, and which ones are ready to go in the next commit.
```bash
git status
```

## Step 2: "Stage" (add) the changes
Before committing, you need to tell Git *which* changes you want to include in your "save point". 

To add all modified files at once, run:
```bash
git add .
```
*(Tip: Sometimes it's better to add one specific file at a time, for example: `git add src/App.tsx`)*

## Step 3: Commit the changes
Once the files are staged, you bundle them together into a "commit" and attach a customized, readable message so you know what you did when you look back later.
```bash
git commit -m "Your descriptive message here"
```
*(Example: `git commit -m "Fix login button styling"`)*

## Step 4: Push to the remote repository (GitHub/GitLab)
To upload your committed changes online to your repository so others (and your deployed site/coworkers) can see them:
```bash
git push
```

## Undoing Mistakes
If you accidentally run `git add .` and want to unstage all files to review them again:
```bash
git reset
```
