class TimeBlockConfig {
  constructor(start, end, daysOfWeek, holidayExclusions, userOrTeamAssociation, bentoIdentifier, activeStatus) {
    this.start = start;
    this.end = end;
    this.daysOfWeek = daysOfWeek;
    this.holidayExclusions = holidayExclusions;
    this.userOrTeamAssociation = userOrTeamAssociation;
    this.bentoIdentifier = bentoIdentifier;
    this.activeStatus = activeStatus;
  }

  isActive() {
    return this.activeStatus;
  }

  isWithinTimeBlock(date) {
    const dayOfWeek = date.getDay();
    const isWeekday = this.daysOfWeek.includes(dayOfWeek);
    const isHoliday = this.holidayExclusions.includes(date.toISOString().split('T')[0]);
    const isWithinTime = date >= this.start && date <= this.end;

    return isWeekday && !isHoliday && isWithinTime;
  }
}

module.exports = TimeBlockConfig;
