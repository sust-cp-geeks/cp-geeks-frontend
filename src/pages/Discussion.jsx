import React from 'react';
import './Tables.css';

const Discussion = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Discussion Board</h1>
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Author</th>
              <th>Replies</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Need help with Fast I/O in C++</td>
              <td>hasan_007</td>
              <td>12</td>
              <td>2 mins ago</td>
            </tr>
            <tr>
              <td>Explanation for Problem D from yesterday's contest</td>
              <td>algo_master</td>
              <td>4</td>
              <td>1 hour ago</td>
            </tr>
            <tr>
              <td>Best resources to learn Segment Trees?</td>
              <td>newbie_coder</td>
              <td>21</td>
              <td>5 hours ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Discussion;
