/**
 * Time limits the execution of a task 
 * it will not execute the task if the limit time has not yet passed
 *
 * @class TaskTimeLimiter
 */
class TaskTimeLimiter {
  constructor(timeInMs) {
    this.timeLimit = timeInMs;
    this.lastExecuted = 0;
  }

  executeTask(task) {
    if(task && typeof task === 'function'){
      const now = Date.now();
      if(now - this.lastExecuted >= this.timeLimit) {
        this.lastExecuted = now;
        task();
      }
    }
  }
}

module.exports = TaskTimeLimiter;