import React from 'react';
import './Tables.css';

const Problems = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Problem Set</h1>
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Problem Name</th>
              <th>Difficulty</th>
              <th>Solved By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>101</td>
              <td>Alice and the Magic Tree</td>
              <td><span style={{color: '#4ade80'}}>Easy</span></td>
              <td>450</td>
            </tr>
            <tr>
              <td>102</td>
              <td>Bob's Maximum Subarray</td>
              <td><span style={{color: '#fbbf24'}}>Medium</span></td>
              <td>215</td>
            </tr>
            <tr>
              <td>103</td>
              <td>The Mysterious Graph Connectedness</td>
              <td><span style={{color: '#f87171'}}>Hard</span></td>
              <td>42</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Problems;
