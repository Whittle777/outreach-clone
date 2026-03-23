class SequenceStateMachine {
  constructor() {
    this.states = {
      Active: 'Active',
      Paused: 'Paused',
      Completed: 'Completed',
    };
    this.currentStatus = this.states.Active;
  }

  transitionTo(state) {
    if (Object.values(this.states).includes(state)) {
      this.currentStatus = state;
      console.log(`Sequence state transitioned to: ${state}`);
    } else {
      console.error(`Invalid state: ${state}`);
    }
  }

  getCurrentStatus() {
    return this.currentStatus;
  }
}

module.exports = SequenceStateMachine;
