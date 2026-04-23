import React from 'react';
import './Tables.css';

const Contest = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Contests</h1>
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1042</td>
              <td>SUST IUPC 2023 Preliminary</td>
              <td>Oct 28, 2023 10:00 AM</td>
              <td>03:00</td>
              <td><span style={{color: '#60a5fa'}}>Upcoming</span></td>
            </tr>
            <tr>
              <td>1041</td>
              <td>Weekly Practice Contest #45</td>
              <td>Oct 21, 2023 03:00 PM</td>
              <td>02:00</td>
              <td><span style={{color: '#a78bfa'}}>Running</span></td>
            </tr>
            <tr>
              <td>1040</td>
              <td>End of Semester Long Contest</td>
              <td>Oct 01, 2023 12:00 AM</td>
              <td>7 days</td>
              <td><span style={{color: '#94a3b8'}}>Ended</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Contest;
