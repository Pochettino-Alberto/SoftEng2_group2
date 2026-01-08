# RETROSPECTIVE (Team 02)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done: 3 vs 3
- Total points committed vs. done: 23 vs 23
- Nr of hours planned vs. spent (as a team): 83h 30m vs 73h 37m

**Remember** A story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                      | # Tasks | Points | Hours est. | Hours actual |
| -------------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_            | 12      | -      | 4d6h30m    | 4d 4h 35m    |
| User Authentication        | 9       | 13     | 2d30m      | 1d 4h 7m     |
| Municipality User Handling | 10      | 5      | 2d1h       | 2d 50m       |
| Role Assignments           | 8       | 5      | 1d4h30m    | 1d 5m        |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean  | StDev |
| ---------- | ----- | ----- |
| Estimation | 2.141 | 2.279 |
| Actual     | 1.888 | 2.389 |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

$$\frac{\sum_i \text{spent}_{task_i}}{\sum_i \text{estimation}_{task_i}} - 1 = -0.12 = -12\%$$

**Result:** The total estimation error is **-12%**, which means that the effective work required about 12% less time, compared to what was estimated.

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

$$\frac{1}{39}\sum_{i=1}^{39} \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| \approx 33.9\%$$

**Meaning:** The average absolute error per single task is **33.9%**, which tells us that, on average, every single esteem deviated from the effective value of about 33.9%. Such a value is higher than the total error (-12%) because some errors have compensated each other (some esteems were too high, others too low).

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated - `7h`
  - Total hours spent - `4h 30m`
  - Nr of automated unit test cases - `61`
  - Coverage - `72%`
- E2E testing:
  - Total hours estimated - `7h`
  - Total hours spent - `4h 55m`
  - Nr of test cases - `23`
- Code review
  - Total hours estimated - `11h`
  - Total hours spent - `7h`

## ASSESSMENT

- What did go wrong in the sprint?

  > Due to personal issues of some team members, we had to do most of the work at the end of the sprint

- What caused your errors in estimation (if any)?

  > Some tasks required less/more time than the estimated one. We also left some spare time for bugfixing and eventually adding new tickets. Furthermore, during the sprint, we change our perspective on the tasks that we should implement, resulting in developing more than needed.

- What lessons did you learn (both positive and negative) in this sprint?

  > We should not attempt to anticipate future developments in a single sprint. We should keep work in the scope of the current sprint.

  > We not only estimated the time required to accomplish the task, but also considered the debugging time of the task too. This is something we have learned and applied in this sprint.

- Which improvement goals set in the previous retrospective were you able to achieve?

  > Comparing this sprint planning with the last one, we noticed that improving the description of the tasks resulted in less misunderstanding and better and more optimized performance.
  > We underestimated our tasks in the previous sprint, not considering the bug fixes we were going to deal with. We successfully overcame this issue in this sprint and added extra time to the tasks for it.

- Which ones you were not able to achieve? Why?

  > One of the goals that we set is to organize and assign tasks in a manner that nobody should wait for another's work to be finished. Unfortunately, this problem occurred again for one task only. The reason that we faced this problem again was that we did not assign this task, thinking that there was a prerequisite task for it. So two connected tasks were assigned to different people, and the issue occurred again.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > For organizational purposes, we can distribute the effort more equally throughout the whole sprint. Our goal for the next sprint is to establish internal deadlines within our team periodically. Moreover, we will analyze our tasks better so that connected tasks will be more apparent during the assignment phase.

- One thing you are proud of as a Team!!

  > We successfully finished all the stories we have planned for this sprint, meaning that our planning abilities have improved.
