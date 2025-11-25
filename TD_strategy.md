# Technical Debt Management Strategy

## 1. Code Quality Checks
To enforce high standards and prevent debt accumulation, we utilize **SonarCloud** integrated into our CI pipeline.

### A. Automated Analysis (SonarCloud)
* **Continuous Inspection:** Every change on the main branch is automatically analyzed by SonarCloud.
* **Quality Gate:** We have defined a "Quality Gate" that we check every time new code is merged on main branch. These checks will help us to plan technical debt related tasks, so that our technical debt does not accumulate over the next sprints. The gate checks for:
    * **Bugs:** 0 New Bugs.
    * **Vulnerabilities:** 0 New Vulnerabilities.
    * **Code Smells:** No critical code smells introduced.
    * **Duplication:** Less than 3% code duplication.
    * **Coverage:** New code must have at least 80% test coverage.

### B. Definition of Done (DoD)
A user story is considered "Done" only when:
-  The SonarCloud Quality Gate passes (Green status).
- The build runs successfully on the CI server (GitHub Actions).
- Unit Tests passing
- Code review completed
- Code present on VCS (Github repository)
- End-to-End tests performed
---

## 2. Paying Back Technical Debt
We use SonarCloud metrics to guide our debt repayment strategy.

### A. Tracking Debt
* We rely on the **SonarCloud Ratings** to identify areas of high debt.


### B. Prioritization Strategy
We prioritize debt based on impact:
1.  **High Priority:** Debt in core features that blocks development or causes bugs.
2.  **Low Priority:** Cosmetic issues or code in rarely used modules.

### C. Repayment Workflow
* **Better task approach:** If while completing the task, one of us has to manage several files, he should try to fix warnings that don't require too much effort. For example, assuming that one of us is about to modify a file that contains a code smell: before adding new code to the file, the person should fix the code smell.
* **Review:** During Sprint Planning, we review the oldest debt tickets to see if they need to be addressed in the coming sprint. We will create tasks to address high priority technical debt. The total time effort dedicated to solve the technical debt related tasks should not require more than 15% of the total time budget of the current sprint.
---
