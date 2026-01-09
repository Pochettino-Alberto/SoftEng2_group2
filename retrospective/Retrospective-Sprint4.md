# RETROSPECTIVE (Team 02)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 4 vs 4
- Total points committed vs done : 29 vs 29
- Nr of hours planned vs spent (as a team) : 83h 40m vs 80h 55m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story                                                                | # Tasks | Points | Hours est. | Hours actual |
| -------------------------------------------------------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_                                                      | 12      | -      | 46h 30m    | 49h          |
| PT-07 Show approved reports on the map to the citizens               | 4       | 5      | 9h 30m     | 6h 35m       |
| PT-25 update report status by external mainteiner                    | 7       | 3      | 9h 55m     | 9h 20m       |
| PT-26 technical officers and external mainteiner can comment reports | 11      | 8      | 16h 45m    | 14h 55m      |
| PT-28 Show approved reports on the map to unregistered users         | 1       | 13     | 1h         | 1h 5m        |

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean  | StDev |
| ---------- | ----- | ----- |
| Estimation | 2.39h | 3.22h |
| Actual     | 2.31h | 3.23h |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1
  $$\frac{\sum_i \text{spent}_{task_i}}{\sum_i \text{estimation}_{task_i}} - 1 \approx -3 \%$$

**Result:** The total estimation error is **-3%**, which means that the effective work required about 3% less time, compared to what was estimated.

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

$$\frac{1}{n}\sum_{i=1}^{n} \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| \approx 17\%$$

**Meaning:** The average absolute error per single task is **17%**, which tells us that, on average, every single esteem deviated from the effective value of about 17%. Such a value is higher than the total error (-3%) because some errors have compensated each other (some esteems were too high, others too low).

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated 1h 40m
  - Total hours spent 1h
  - Nr of automated unit test cases 165
  - Coverage (if available) 85.04%
- Integration testing:
  - Total hours estimated 1h 40m
  - Total hours spent 1h 45m
- E2E testing:
  - Total hours estimated 7h (1h30m + 1h30m + 1h + 1h30m + 1h30m)
  - Total hours spent 5h (45m + 1h + 1h + 45m + 1h30m)
- Code review:
  - Total hours estimated 9h (3h + 3h + 3h)
  - Total hours spent 6h 50m (1h + 3h20m + 2h30m)
- Technical Debt management:
  - Strategy adopted: [TD_Strategy](../TD_strategy.md)
  - Total hours estimated estimated at sprint planning 5h
  - Total hours spent 8h 15m

## ASSESSMENT

- What caused your errors in estimation (if any)?

  > On this sprint we have overestimated some tasks related to testing.

- What lessons did you learn (both positive and negative) in this sprint?

  > Positive lesson: we started and finished our tasks before ending days and it left us some time for reviewing. 
  > Negative lesson: 

- Which improvement goals set in the previous retrospective were you able to achieve?
  >We allocated time to fix the eventual failing tests, due to the new code for this sprint, on a separate Technical Debt task
- Which ones you were not able to achieve? Why?
  >When we have edited the backend logic for bugfixing, we forgot to add a comment to the relative Test Backend task. That could have contributed to save time to the test developer.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > 

- One thing you are proud of as a Team!!
  > We have improved a lot on task estimation: we got a low total-estimation-error of 3% and a quite low average-absolute-error-per-single-task 17%.
  The values we got for these two metrics on the previous sprint were respectively 4 times and 2 times bigger.
