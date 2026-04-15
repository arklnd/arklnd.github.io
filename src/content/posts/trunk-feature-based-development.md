---
title: "Trunk-Based Development vs Feature-Based Development"
description: "A comprehensive comparison of TBD and GitFlow covering workflows, release mechanisms, conflict management, and framework upgrade strategies."
date: 2026-04-14T11:30:00
---

## A comprehensive comparison guide covering workflows, release mechanisms, conflict management, and framework upgrade strategies.

---

## Table of Contents

1. [Core Philosophies](#1-core-philosophies)
2. [Head-to-Head Comparison](#2-head-to-head-comparison)
3. [Pros and Cons](#3-pros-and-cons)
4. [When to Follow Which?](#4-when-to-follow-which)
5. [Feature-Based Development Release Mechanism](#5-feature-based-development-release-mechanism)
6. [Bug Fixes for Old Releases](#6-bug-fixes-for-old-releases)
7. [Avoiding Git Conflicts in Feature-Based Development](#7-avoiding-git-conflicts-in-feature-based-development)
8. [Managing Long Framework Version Upgrades](#8-managing-long-framework-version-upgrades)
9. [Branching Strategy Walkthroughs](#9-branching-strategy-walkthroughs)
10. [Merge vs Rebase — When to Use Which at Every Merge Point](#10-merge-vs-rebase--when-to-use-which-at-every-merge-point)

---

## 1. Core Philosophies

### Trunk-Based Development (TBD)

- **The Model:** Developers merge small, frequent updates to a single "trunk" (`main` branch) multiple times a day.
- **The Goal:** Eliminate long-lived branches to ensure the codebase is always in a "releasable" state.
- **Mechanism:** If a feature isn't ready for users, it is hidden behind **Feature Flags** (toggles) rather than being kept on a separate branch.

### Feature-Based Development (GitFlow)

- **The Model:** Developers create dedicated branches for each feature, which may live for days or weeks.
- **The Goal:** Isolate work until it is 100% complete and tested before merging it into the main development line.
- **Mechanism:** Uses multiple persistent branches (e.g., `develop`, `release`, `hotfix`, `feature/xyz`).

---

## 2. Head-to-Head Comparison

| Aspect | Trunk-Based Development | Feature-Based Development |
|---|---|---|
| **Branch Lifespan** | Hours (max 1–2 days) | Days, weeks, or months |
| **Merge Frequency** | Very High (Multiple times daily) | Low (Only at feature completion) |
| **Merge Conflicts** | Small & easy to fix | High risk of "Merge Hell" |
| **Testing** | Relies on heavy Automation | Relies on manual/isolation testing |
| **Deployment** | Supports Continuous Deployment | Supports Scheduled Releases |
| **Visibility** | Everyone sees everyone's code daily | Code is hidden until the Merge Request |

---

## 3. Pros and Cons

### Trunk-Based Development

#### Pros

- **Speed:** Accelerates the feedback loop; bugs are caught almost immediately after they are written.
- **Simplicity:** No complex branching logic or "branch management" overhead.
- **Collaboration:** Forces team members to stay in sync, reducing duplicate work.
- **DORA Excellence:** A hallmark of elite engineering organizations, as recognized by DORA research.

#### Cons

- **High Pressure on CI:** Requires a bulletproof automated test suite. If the trunk breaks, everyone is blocked.
- **Seniority Required:** Can be dangerous for very junior teams who might accidentally "break the build" frequently.
- **Complexity in Code:** Requires managing Feature Flags, which can lead to technical debt if not cleaned up.

### Feature-Based Development

#### Pros

- **Isolation:** You can experiment or build massive features without affecting the production-ready code.
- **Controlled Reviews:** Ideal for regulated industries where every feature needs a formal, exhaustive sign-off.
- **Easier for Juniors:** Provides a "safe space" to work without fear of crashing the main site.

#### Cons

- **Divergence:** The longer a branch lives, the harder it is to merge. You often spend more time fixing conflicts than writing code.
- **Slower Delivery:** Integration happens at the end, meaning bugs are often discovered weeks after the code was written.
- **Review Bottlenecks:** Pull Requests (PRs) become massive, making them exhausting and difficult to review properly.

---

## 4. When to Follow Which?

### Choose Trunk-Based Development if:

- You are aiming for **Continuous Delivery (CD)** and want to deploy several times a day.
- Your team is **experienced** and comfortable with automated testing.
- You are building a **SaaS or Web App** where there is only one "live" version.
- You want to **improve team collaboration** and visibility.

### Choose Feature-Based Development if:

- You are building **Open Source software** where you can't trust every contributor's direct commits.
- You have **Junior-heavy teams** who need a sandbox to learn.
- You must maintain **Multiple Versions** of the software simultaneously (e.g., supporting v1.0, v2.0, and v3.0 all at once).
- You have a very strict, **manual QA/Release process** required by law or contract.

### The "Modern Middle Ground": Scaled Trunk-Based Development

Many high-performing teams use a hybrid approach:

1. Create a **short-lived feature branch**.
2. Work on it for **less than 24 hours**.
3. Open a **Pull Request**, get a quick review, and merge it into the trunk.
4. If the feature isn't done, keep it "off" using a **feature flag** in the code.

---

## 5. Feature-Based Development Release Mechanism

In Feature-Based Development (GitFlow), the release mechanism is a structured, multi-stage process designed to ensure that only fully tested and approved features reach the end-user. Unlike Trunk-Based Development, where the `main` branch is always live, this model uses a buffer between development and production.

### The Release Workflow

#### Stage 1: The Integration Stage (`develop` branch)

As individual feature branches are completed, they are merged into a central `develop` branch. This branch acts as the "staging area" for the next release. It contains all the features targeted for the upcoming version but is not yet considered stable for production.

#### Stage 2: The Branching Stage (`release/vX.X` branch)

When the team decides there are enough features for a release, a **Release Branch** is created from `develop`.

- **The Freeze:** No new features are allowed to enter this branch.
- **Purpose:** This branch is dedicated solely to "polishing" — bug fixes, documentation updates, and minor tweaks.

#### Stage 3: The Hardening Stage (QA & UAT)

The release branch is deployed to a staging or UAT (User Acceptance Testing) environment.

- QA engineers perform regression testing.
- If bugs are found, they are fixed directly on the release branch and then merged back into `develop` to ensure the next release doesn't re-introduce the same bug.

#### Stage 4: The Final Merge (`main` / `master` branch)

Once the release branch is stable and signed off:

- It is merged into the `main` branch.
- A **Version Tag** (e.g., `v2.4.0`) is applied to the merge commit.
- The `main` branch is then deployed to the production environment.

#### Stage 5: The Sync Stage

Finally, the release branch is merged back into `develop` one last time. This ensures that any "last-minute" bug fixes made during the hardening stage are reflected in the ongoing development of the next version.

### Comparison of Release Mechanics

| Aspect | Feature-Based (GitFlow) | Trunk-Based |
|---|---|---|
| **Release Timing** | Batched (Monthly, Bi-weekly) | Continuous (Daily, Hourly) |
| **Gating** | Pull Requests & Release Branches | Automated Testing & Feature Flags |
| **Stability** | Built through a "Hardening" phase | Built-in by keeping trunk "Green" |
| **Hotfixes** | Requires a dedicated hotfix branch | Fixed on trunk and pushed immediately |

### When This Mechanism Is Most Effective

- **Regulatory Compliance:** When you need a "paper trail" of exactly what was tested and approved before it went live.
- **Mobile Apps:** Since you cannot "undo" a download once a user has it, the extra hardening phase on a release branch provides a safety net.
- **Complex Migrations:** When multiple features depend on a massive database schema change that cannot be easily toggled off.

---

## 6. Bug Fixes for Old Releases

Handling a bug in an old version while a newer version is already live requires a specific "Hotfix" or "Support" mechanism. Since your `main` branch usually points to the latest release, you can't simply push a fix there without involving the new code.

### Approach 1: The "Hotfix" Approach (For the Current Live Version)

If the bug is in the version that was just released and is currently sitting on `main`, use a **Hotfix Branch**.

1. **Branch:** Create a `hotfix/v1.1.1` branch directly from `main`.
2. **Fix:** Apply the code fix and verify it in isolation.
3. **Merge & Tag:** Merge the fix into `main` and create a new tag (e.g., `v1.1.1`).
4. **Backport:** Crucially, you must also merge that hotfix into `develop` (and any active `release` branches) so the bug doesn't reappear in the next release.

### Approach 2: The "Support Branch" Approach (For Much Older Versions)

If you have already released v2.0, but a client is still using v1.0 and needs a critical patch, use **Support Branches**. This is common in Enterprise software or APIs.

1. **Locate the Tag:** Find the git tag for the old release (e.g., `v1.0.0`).
2. **Create a Support Branch:** Create a branch from that tag: `git checkout -b support/v1.x v1.0.0`.
3. **Apply the Patch:** Commit the fix to this support branch.
4. **Release & Tag:** Deploy from this branch and tag it as `v1.0.1`.

> **Note:** These changes are rarely merged back into `main` because the codebases have likely diverged too much. Instead, you manually "cherry-pick" the fix into the current version if the bug still exists there.

### Comparison of Fix Strategies

| Scenario | Strategy | Workflow |
|---|---|---|
| Bug in the latest production version | **Hotfix** | Branch from `main`, merge to `main` & `develop`. |
| Bug in a version 2-3 years old | **Support Branch** | Branch from the old tag, stay on that branch. |
| Bug found during testing (not live) | **Bugfix** | Fix directly on the release or feature branch. |

### Key Maintenance Tips

- **Cherry-Picking:** If the bug exists in both the old version and the new version, use `git cherry-pick [commit-hash]` to apply the exact same fix across different branches without merging unrelated code.
- **Automated Testing:** When you fix a bug in an old release, run your full regression suite for that specific version. Old code often lacks the safeguards of your newer architecture.
- **Deprecation Policy:** Clearly define how many "old" versions you support. Trying to provide fixes for 10 different old versions simultaneously leads to "Maintenance Exhaustion."

---

## 7. Avoiding Git Conflicts in Feature-Based Development

Git conflicts (or "merge hell") usually happen because branches live too long and diverge from the main codebase. The longer you wait to merge, the higher the chance someone else has modified the same lines.

### Strategy 1: Sync Frequently (The "Pull Constantly" Rule)

The biggest mistake is waiting until a feature is 100% finished to see what others have done.

- **Daily Integration:** Every morning, pull the latest changes from the `develop` (or `main`) branch into your local feature branch.
- **Command:** `git pull origin develop`
- **Why:** This forces you to resolve tiny, 2-line conflicts every day rather than a 500-line conflict at the end of the week.

### Strategy 2: Prefer Rebase over Merge for Local Work

When you want to bring updates from the base branch into your feature branch, use `rebase`.

- **The Logic:** Rebase takes your commits and "re-stacks" them on top of the latest changes from the base branch. This keeps the history linear and much easier to read.
- **Command:** `git pull --rebase origin develop`
- **Benefit:** It prevents the "messy spiderweb" of merge commits in your history.

### Strategy 3: Atomic and Small Features

The size of your feature branch is directly proportional to the pain of the merge.

- **Break it down:** Instead of one massive `feature/user-authentication` branch that takes two weeks, break it into `feature/auth-ui`, `feature/auth-api`, and `feature/auth-validation`.
- **Why:** Small branches touch fewer files, significantly reducing the "surface area" for potential conflicts.

### Strategy 4: Communication & Task Splitting

Conflicts are often a sign of overlapping responsibilities.

- **File Ownership:** If two developers are working on the same Angular component or .NET controller simultaneously, a conflict is guaranteed.
- **Architectural Separation:** Use the Single Responsibility Principle. If your logic is separated into small, modular services or partial classes, developers can work on the same "feature" while touching entirely different files.

### Strategy 5: Use `.gitattributes` for Consistent Formatting

Sometimes, "conflicts" aren't even about code — they are about line endings or auto-formatting (tabs vs. spaces).

- **The Fix:** Add a `.gitattributes` file to your root directory to enforce `LF` or `CRLF` endings across the whole team.
- **Pre-commit Hooks:** Use tools like Husky or Prettier to format code before it's committed. This ensures that a "Merge Conflict" isn't just someone's IDE re-aligning brackets.

### Strategy 6: The "Early PR" Strategy

Open a **Draft Pull Request** as soon as you start working.

- Even if the code isn't finished, a Draft PR allows teammates to see which files you are "occupying."
- Most Git platforms (GitHub/GitLab/Azure DevOps) will show a "Conflict Warning" on the PR page in real-time if someone else merges a change that clashes with your work-in-progress.

### Summary Checklist

| Action | Frequency | Purpose |
|---|---|---|
| Pull from Develop | Twice Daily | Catch changes early. |
| Rebase | Daily | Keep history clean. |
| Commits | Hourly | Small, logical "save points." |
| Communication | Constant | Avoid touching the same file as a peer. |

---

## 8. Managing Long Framework Version Upgrades

Managing a major framework upgrade (like moving from .NET 6 to 8 or Angular 14 to 18) within a Feature-Based Development model is one of the most difficult tasks. If you create a single "Upgrade" branch and work on it for a month, the merge conflict at the end will be catastrophic.

### Pattern 1: Branch by Abstraction

Instead of trying to upgrade the whole framework at once, create an abstraction layer that allows the old and new versions to coexist or makes the eventual "swap" a single-line change.

- **The Strategy:** Wrap framework-specific features (e.g., HTTP clients, state management, or Auth providers) in your own interfaces or wrapper services.
- **The Benefit:** You can upgrade the underlying implementation on your feature branch while keeping the interface the same for the rest of the team.

### Pattern 2: The "Bridge" or "Dual-Track" Branching

This is a more structured approach for team environments:

1. **Create a Long-Lived "Stability" Branch:** Create a branch called `chore/framework-upgrade`.
2. **Regular Back-Merging:** Every single day, you must merge `develop` into the `upgrade` branch.
   - **Why?** You want to fix the framework-related breaking changes on new feature code as it arrives, rather than facing 1,000 errors on merge day.
3. **The "Big Flip":** Once the upgrade branch is stable, you perform a "Merge Train" where you freeze `develop` for a few hours, merge the upgrade in, and then everyone else rebases their active features onto the new version.

### Pattern 3: Incremental Migration (Recommended for Angular/.NET)

Modern frameworks often allow for incremental upgrades. For example, in Angular you can use Standalone Components alongside Modules.

- **Step-by-Step:** Do not upgrade the whole app. Create a "Migration Epic" and create small feature branches for specific modules:
  - **Branch A:** Upgrade the Build Pipeline (Webpack to Esbuild/Vite).
  - **Branch B:** Upgrade the Core Library.
  - **Branch C:** Migration of Shared UI Components.
- **The Benefit:** This allows you to merge parts of the upgrade into the `main/develop` branch early, reducing the "delta" between the two versions.

### Pattern 4: The "Strangler Fig" Pattern

If the framework upgrade is a massive rewrite (e.g., moving from an old monolith to a new architecture), use a proxy.

- **Mechanism:** Route a small percentage of traffic (or specific routes) to the "new framework" version of the app while the rest remains on the "old framework" version.
- **Release:** Once all features are migrated and tested on the new version, you "strangle" the old version and decommission it.

### Comparison of Upgrade Strategies

| Strategy | Conflict Risk | Speed | Best For |
|---|---|---|---|
| Big Bang Merge | 🔴 Extreme | Fast (initially) | Very small projects. |
| Back-Merging Daily | 🟡 Medium | Moderate | Standard enterprise apps. |
| Incremental (Feature Flags) | 🟢 Low | Slow | High-traffic, mission-critical apps. |

### Technical Safety Checklist

- **Dual CI Pipelines:** If possible, set up two CI jobs. One that runs the current `develop` code and one that runs the `upgrade` branch code.
- **Breaking Change Audit:** Before starting, create a document listing every breaking change in the framework and assign "owners" to investigate how they affect your specific codebase.
- **Lock Dependencies:** During an upgrade, strictly lock your `package.json` or `NuGet` versions to prevent "version drift" where a sub-dependency breaks the build.

---

## 9. Branching Strategy Walkthroughs

End-to-end examples using ASCII diagrams for both strategies, covering feature development, release cycles, hotfixes, and legacy version support.

---

### Trunk-Based Development Walkthrough

#### Step 1 — Feature Work (Short-Lived Branch)

Each developer works on a branch that lives for less than 24 hours. Incomplete features are merged behind a **feature flag** so they cannot affect users.

```
TIME ────────────────────────────────────────────────────────────────►

  feat/search  ●─●─●
              /     \
main  ─●──────────────●──────────────────────────────────────────────►
      v1.0           [M1]
                      │
                  flag=OFF → "search" hidden from users

                       feat/checkout  ●─●─●─●
                                     /       \
main  ──────────────────────────────────────────●────────────────────►
                                               [M2]
                                                │
                                           flag=ON → live for users
```

#### Step 2 — Release (Tag on Main, No Dedicated Release Branch)

There is no release branch. The `main` branch is always deployable. A tag marks a production release, and the CI/CD pipeline handles the rest.

```
main  ─●──────●──────●──────●──────●──────────────────────────────────►
       │      │      │      │      │
      v1.0   v1.1   v1.2   v1.3   v2.0
       ↑      ↑      ↑      ↑      ↑
  CD deploys automatically on every tagged commit
```

#### Step 3 — Hotfix (Fix Committed Directly on Main)

There is no hotfix branch. The developer commits the fix directly to `main`. The CI/CD pipeline validates and deploys it within minutes.

```
main  ──────────────────●──────────────────────────────────────────────►
                        │
                       v2.0
                        │
                    bug discovered
                        │
                    fix committed directly to main
                        │
main  ───────────────────────────●─────────────────────────────────────►
                                 │
                                v2.0.1
                                 │
                            CD deploys within minutes
```

#### Step 4 — Old Version Support

> TBD deliberately maintains only **one live version**. If your product requires concurrent support for old releases, TBD is not the right model — use GitFlow with Support Branches.

---

### Feature-Based Development (GitFlow) Walkthrough

#### Step 1 — Feature Work (Feature Branch → Develop)

Each feature lives on its own branch and only merges to `develop` after a full code review and approval.

```
feat/auth       ┌─●─●─●─●─●─┐
                │           ↓ (PR merged after review)
develop        ─●───────────●────────────────────────────────────────►


feat/dashboard              ┌─●─●─●─●─●─●─┐
                            │             ↓ (PR merged after review)
develop        ─●───────────●─────────────●──────────────────────────►
```

#### Step 2 — Release Cycle (Develop → Release Branch → Main)

Once enough features accumulate in `develop`, a release branch is cut. Only bug fixes go in. After QA sign-off it merges to `main`, gets a version tag, and is deployed. It is then synced back to `develop`.

```
                               release/v2.0
                                ●─●─●  (QA hardening & bug fixes only)
                              /       \
                             /         \ (sync back)
develop  ─●─────────────────●───────────●───────────────────────────►
          ↑                 ↑
     sprint begins     branch cut
      (features)      from develop

main     ─●──────────────────────────────●──────────────────────────►
         v1.0                            v2.0
                                          ↑
                                     tag applied
                                     & deployed to production
```

#### Step 3 — Hotfix (Bug in the Current Live Version on Main)

A hotfix branch is cut from `main`, not `develop`. After the fix is verified, it merges into **both** `main` (for the immediate release) and `develop` (to prevent the bug from reappearing in the next version).

```
          ─●─● hotfix/v2.0.1 ●─●─●─
        /                           \
main  ─●─────────────────────────────●──────────────────────────────►
      v2.0                           v2.0.1
                                     ↑
                                tag applied & deployed

              hotfix/v2.0.1 ─────────●  (backported)
                                      \
develop  ─●────────────────────────────●───────────────────────────►
                                       ↑
                               prevents regression in v2.1
```

#### Step 4 — Support Branch (Bug Fix for an Old Version)

If a client reports a critical bug in `v1.0` while `main` is already at `v3.0`, create a Support Branch from the old git tag. Fixes stay on this branch and are tagged as legacy patch releases. If the bug also affects the current version, use `git cherry-pick` to apply it to `main`.

```
  git tag: v1.0.0  ← 2 years old; main is now at v3.0
        │
        │  git checkout -b support/v1.x v1.0.0
        ↓
support/v1.x  ─●───────────────────●───────────────────────────────►
               ↑                    │
          (legacy v1 code)    fix applied → v1.0.1
                                    │
                           deployed to legacy clients only
═════════════════════════════════════════════════════════════════════
              cherry-pick (if bug also present in current version)
                                    │
                                    ↓
main          ─●────────────────────────────────●───────────────────►
              v3.0                              v3.0.1
```

#### Full Picture — All Branch Types Across Time

This diagram consolidates every branch type from the GitFlow model into a single timeline. Reading it top-to-bottom shows how the branches interact with each other across a product's lifecycle:

```
TIME ──────────────────────────────────────────────────────────────────────────────►

support/v1.x  ─●──────────────────●─────────────────────────────────────────────►
                ↑ (from v1.0)      v1.0.1 → legacy clients

feat/auth      ┌─●─●─●─●─●─●─●──┐
               │                ↓
develop       ─●────────────────●──────────────────────●────────────────────────►
                                                      /│
                                feat/dashboard ─●─●─●┘ │
                                                       │
                                          release/v2.0 ─●─●─●─●┐ (QA fixes)
                                                               ↓
main          ─●───────────────────────────────────────────────●──────●─────────►
              v1.0                                             v2.0   v2.0.1
                                                                       ↑
                                                hotfix/v2.0.1 ─●─●─●───┘ (→ main & develop)
```

**Reading the diagram:**

1. **Support Branch** (top) — A `support/v1.x` branch was created from the old `v1.0` tag long after the team moved on. A patch (`v1.0.1`) is applied and shipped only to legacy clients still running v1.
2. **Feature Branches → Develop** — `feat/auth` is developed independently, then merged into `develop` via a Pull Request. Later, `feat/dashboard` follows the same pattern. Each `●` represents a commit on the feature branch.
3. **Release Branch** — Once `develop` has enough features, a `release/v2.0` branch is cut. Only QA bug fixes go here (no new features). After hardening, it merges down into `main`.
4. **Main** — Receives the stable release as `v2.0`. This is the only branch that reaches production.
5. **Hotfix Branch** (bottom) — A critical bug is found in `v2.0` after it goes live. A `hotfix/v2.0.1` branch is cut directly from `main`, the fix is applied, and it merges back into **both** `main` (tagged as `v2.0.1`) and `develop` to prevent the bug from reappearing in the next release cycle.

> **Key takeaway:** In GitFlow, code flows in one direction — from feature branches → `develop` → `release` → `main` — with hotfixes being the sole exception that flows the opposite way, from `main` back into `develop`.

---

## 10. Merge vs Rebase — When to Use Which at Every Merge Point

Choosing the wrong operation at a merge point is one of the most common causes of avoidable conflicts and messy histories. The rule of thumb is simple: **rebase to keep your branch up-to-date; merge to deliver your work into a shared branch.**

### The Core Principle

| Operation | What It Does | Golden Rule |
|---|---|---|
| **Rebase** | Replays your commits on top of the target branch's latest state. Rewrites your commit history. | Use on **private/local** branches only. Never rebase a branch others are working on. |
| **Merge** | Creates a new "merge commit" that ties two histories together. Preserves both histories as-is. | Use when integrating into a **shared/protected** branch. |

> **Why this matters for conflicts:** Rebase resolves conflicts commit-by-commit (small, isolated chunks), while merge resolves them all at once in a single giant diff. Rebasing frequently keeps conflicts tiny; merging a stale branch makes them huge.

---

### Trunk-Based Development — Merge Points

#### 1. Keeping Your Short-Lived Branch Updated (↓ main → feature)

- **Use: Rebase**
- **Command:** `git pull --rebase origin main`
- **Why:** Your branch lives for hours, not days. Rebasing replays your few commits on top of the latest `main`, keeping a linear history and surfacing conflicts one commit at a time.

#### 2. Merging Your Branch into Main (↑ feature → main)

- **Use: Merge (Squash Merge preferred)**
- **Command:** Handled via the PR — select **"Squash and Merge"** on GitHub / Azure DevOps.
- **Why:** Squash merge collapses your branch into a single commit on `main`, keeping the trunk history clean and easy to bisect. A regular merge commit is also acceptable if you want to preserve the granular commit history.

#### 3. Hotfix Committed to Main

- **Use: Direct Commit (or fast-forward merge)**
- **Why:** In TBD, hotfixes are committed straight to `main`. There is no separate branch to merge, so the question of merge vs rebase does not apply.

---

### Feature-Based Development (GitFlow) — Merge Points

#### 1. Keeping Your Feature Branch Updated (↓ develop → feature)

- **Use: Rebase**
- **Command:** `git pull --rebase origin develop`
- **Why:** This is the highest-impact habit for reducing conflicts. Rebasing daily re-stacks your work on top of the latest `develop`, so you resolve small conflicts incrementally instead of facing a wall of them at PR time.

> **Warning:** If multiple developers share a feature branch, use `merge` instead — rebasing a shared branch rewrites history and will force-push over your teammates' work.

#### 2. Merging a Feature into Develop (↑ feature → develop)

- **Use: Merge (No Fast-Forward)**
- **Command:** `git merge --no-ff feature/auth`
- **Why:** The `--no-ff` flag preserves the branch topology in the history, creating an explicit merge commit that shows "this group of commits was the auth feature." This is critical for traceability in regulated or audited environments.

#### 3. Cutting a Release Branch from Develop

- **Use: Branch (no merge or rebase)**
- **Command:** `git checkout -b release/v2.0 develop`
- **Why:** This is a branch creation, not a merge. No operation needed — just cut the branch and freeze features.

#### 4. Bug Fixes on the Release Branch (↓ release → develop)

- **Use: Merge**
- **Command:** `git checkout develop && git merge release/v2.0`
- **Why:** Bug fixes made during QA hardening must flow back into `develop` so they are not lost in the next release. A merge commit clearly records the sync point.

#### 5. Release Branch into Main (↑ release → main)

- **Use: Merge (No Fast-Forward)**
- **Command:** `git checkout main && git merge --no-ff release/v2.0`
- **Why:** This is the production delivery point. The merge commit acts as a permanent record of exactly which release branch produced this version. Tag the resulting commit (`v2.0`).

#### 6. Hotfix Branch into Main (↑ hotfix → main)

- **Use: Merge (No Fast-Forward)**
- **Command:** `git checkout main && git merge --no-ff hotfix/v2.0.1`
- **Why:** Same rationale as the release merge — you need a visible record that a hotfix was applied.

#### 7. Hotfix Backport into Develop (↓ hotfix → develop)

- **Use: Merge (or Cherry-Pick)**
- **Command:** `git checkout develop && git merge hotfix/v2.0.1`
- **Why:** Merge to bring the fix into the development line. If `develop` has diverged significantly and the merge drags in unwanted changes, use `git cherry-pick [commit-hash]` to apply only the specific fix commit.

#### 8. Fix for a Legacy Support Branch

- **Use: Cherry-Pick (not merge, not rebase)**
- **Command:** `git checkout support/v1.x && git cherry-pick [commit-hash]`
- **Why:** The legacy branch and `main` have diverged so far that a merge would pull in years of unrelated changes. Cherry-pick applies only the exact fix commit, nothing else.

---

### Quick Reference Table

| Merge Point | Direction | Operation | Why |
|---|---|---|---|
| Update feature from develop/main | ↓ into your branch | **Rebase** | Small conflicts, linear history |
| Feature → Develop | ↑ into shared branch | **Merge (`--no-ff`)** | Preserves branch topology |
| Feature → Main (TBD) | ↑ into trunk | **Squash Merge** | Clean single-commit history |
| Release → Main | ↑ into production | **Merge (`--no-ff`)** | Auditable release record |
| Release → Develop (sync) | ↓ backport | **Merge** | Prevents bug regression |
| Hotfix → Main | ↑ into production | **Merge (`--no-ff`)** | Visible hotfix record |
| Hotfix → Develop | ↓ backport | **Merge / Cherry-Pick** | Prevents bug regression |
| Fix → Legacy Support Branch | ↓ isolated patch | **Cherry-Pick** | Avoids dragging in unrelated code |

### The One Rule to Remember

> **Rebase _down_, Merge _up_.** 
> Pull changes _down_ into your private branch with rebase. Push changes _up_ into a shared branch with merge.
