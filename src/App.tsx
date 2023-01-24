import './App.less'
import TodoList from './components/TodoList'
import { Row, Col } from 'antd'

function App() {
  return (
    <Row justify='center' align='middle' className="App">
      <Col xs={24} md={12}><TodoList /></Col>
    </Row>
  )
}

export default App
