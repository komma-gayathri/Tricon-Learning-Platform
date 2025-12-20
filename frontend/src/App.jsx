import React from 'react'
import './App.css'
import Card from './components/Card'
function App() {

  return (
    <>
      <Card
        title="Card Title"
        subtitle="This is a subtitle"
        actions={<button className="text-blue-500">Action</button>}
      >
        <p>This is the content of the card.</p>
      </Card>
    </>
  )
}

export default App
