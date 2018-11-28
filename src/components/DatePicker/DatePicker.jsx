import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DayPicker from 'react-day-picker/DayPickerInput';
import './DatePicker.scss';

export default class DatePicker extends Component {
  constructor(props) {
    super(props);

    this.onDateChange = this.onDateChange.bind(this);
  }

  onDateChange(selectedDay, modifiers, dayPickerInput) {
    const input = dayPickerInput.getInput();
    this.props.onDateChange({
      value: input.value.trim(),
      isEmpty: !input.value.trim(),
      isValid: typeof selectedDay !== 'undefined',
    });
  }

  render() {
    const { value } = this.props;
    return (
      <div className="DatePicker">
        <DayPicker onDayChange={this.onDateChange} value={value} formatDate={formatDate} inputProps={{className: 'form-control'}} />
      </div>
    );
  }
}

function formatDate(d) {
  return new Date(d).toISOString().split('T')[0];
}

DatePicker.propTypes = {
  onDateChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};
