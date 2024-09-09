import React from 'react'

import { Helmet } from 'react-helmet'

import './not-found.css'

const NotFound = (props) => {
  return (
    <div className="not-found-container1">
      <Helmet>
        <title>About Us</title>
      </Helmet>
      {/* <h3>HEY THERE!</h3> */}
      <div className="not-found-container2">
        <h1 className="not-found-text2">HEY THERE!</h1>
      </div>
      <div className="not-found-container3">
        <h2 className="not-found-text3">
          This project is merely a chance for me to get hired. I hope you enjoy exploring as much as I enjoyed building!
        </h2>
      </div>
    </div>
  )
}

export default NotFound
