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

**Remember**a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                      | # Tasks | Points | Hours est. | Hours actual |
| -------------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_            | 12      | -      | 4d 4h 35m  | 4d 4h 35m    |
| User Authentication        | 9       | 13     | 1d 4h 7m   | 1d 4h 7m     |
| Municipality User Handling | 10      | 5      | 2d 50m     | 2d 50m       |
| Role Assignments           | 8       | 5      | 1d 5m      | 1d 5m        |

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

**Meaning:** The average absolute error per single task is **33.9%**, which tell us that, on average, every single esteem deviated from the effective value of about 33.9%. Such value is higher than the total error (-12%) because some errors have compensated each other (some esteems were too high, others too low).

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated - `7 h`
  - Total hours spent - `4h 30m`
  - Nr of automated unit test cases - `61`
  - Coverage - `72%`
- E2E testing:
  - Total hours estimated - `7 h`
  - Total hours spent - `4h 55m`
  - Nr of test cases - `23`
- Code review
  - Total hours estimated - `11 h`
  - Total hours spent - `7h`

## ASSESSMENT

- What did go wrong in the sprint?

  

- What caused your errors in estimation (if any)?

  

- What lessons did you learn (both positive and negative) in this sprint?

  

- Which improvement goals set in the previous retrospective were you able to achieve?

  > /

- Which ones you were not able to achieve? Why?

  > /

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  

- One thing you are proud of as a Team!!

  
