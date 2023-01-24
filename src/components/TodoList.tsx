import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getTodos, updateTodo, deleteTodo, addTodo } from '../api/todosApi'
import { AiOutlineDelete, AiOutlinePlusCircle, AiOutlineEdit } from "react-icons/ai";
import { DragDropContext, Draggable } from 'react-beautiful-dnd'
import { StrictModeDroppable as Droppable } from '../helpers/StrictModeDroppable';
import { Todo } from '../utils/types'
import { Form, Card, Input, Button, List, Checkbox, Typography } from 'antd'

const { Title, Text, Paragraph } = Typography

const TodoList = () => {

   const [newTodo, setNewTodo] = useState<string | undefined>('')
   const queryClient = useQueryClient()
   const [page, setPage] = useState(1)
   const totalCountRef = useRef(0)

   const {
      isLoading,
      isError,
      error,
      data,
   } = useQuery(['todos', page], () => getTodos(page), {
      select: data => {
         console.log(data.totalCount)
         totalCountRef.current = data.totalCount
         return data.data.sort((a, b) => {
            if (a.title > b.title) return 1; // если первое значение больше второго
            else if (a.title == b.title) return 0; // если равны
            else return -1; // если первое значение меньше второго
         })
      },
      keepPreviousData: true
   })
   console.log(data)

   const [todos, setTodos] = useState(data)

   useEffect(() => {

      // достаём из local storage JSON где сидят id тудушек в нужном порядке
      const localStorageOrderData = localStorage.getItem(`taskOrder${page}`)

      // здесь будет массив тудушек в нужном порядке
      let myArray: any

      // распаковываем JSON из local storage в массив при наличии данных
      const arrayIdsOrder = localStorageOrderData ? JSON.parse(localStorageOrderData) as string[] : null

      // если данных в local storage не было, то записываем порядок исходя из подгруженных данных
      if (!arrayIdsOrder && data?.length) {
         const idsOrderArray = data.map(todo => todo.id)
         localStorage.setItem(`taskOrder${page}`, JSON.stringify(idsOrderArray))
      }

      // если порядок тудушек лежал в local storage, то записываем туду из даты в нужном порядке в myArray
      if (arrayIdsOrder?.length && data?.length) {
         myArray = arrayIdsOrder.map(pos => {
            const elem = data.find(el => el.id === pos)
            if (!!elem) return elem
         })
         // ищем новые туду...
         const newItems = data.filter(el => {
            return !arrayIdsOrder.includes(el.id)
         })
         // если есть новые туду, то добавляем их в начало myArray
         if (newItems?.length && myArray) {
            myArray = [...newItems, ...myArray]
         }
      }

      if (myArray?.length) {
         setTodos(myArray)
      } else {
         setTodos(data)
      }

   }, [data])

   console.log(totalCountRef.current)
   const addTodoMutation = useMutation(addTodo, {
      onSuccess: () => {
         // Чистит кеш и делает опять запрашивает данные
         queryClient.invalidateQueries('todos')
      }
   })
   const deleteTodoMutation = useMutation(deleteTodo, {
      onSuccess: () => {
         // Чистит кеш и делает опять запрашивает данные
         queryClient.invalidateQueries('todos')
      }
   })
   const updateTodoMutation = useMutation(updateTodo, {
      onSuccess: () => {
         // Чистит кеш и делает опять запрашивает данные
         queryClient.invalidateQueries('todos')
      }
   })

   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (newTodo) {
         addTodoMutation.mutate({
            userId: '1',
            id: '1234567889',
            title: newTodo,
            completed: false
         })
      }
      setNewTodo('')
   }

   const handleDelete = (id: string) => {
      const arrayIdsOrder = JSON.parse(localStorage.getItem(`taskOrder${page}`) || '') as any[]
      if (arrayIdsOrder?.length) {
         const newIdsOrderArray = arrayIdsOrder.filter(el => el !== id)
         localStorage.setItem(`taskOrder${page}`, JSON.stringify(newIdsOrderArray))
      }
      deleteTodoMutation.mutate({ id })
   }
   const newItemSection = (
      <>
         <Title level={2}>Добавить задачу</Title>
         <Card hoverable={true}>
            <Form onFinish={handleSubmit}>
               <Form.Item>
                  <Input
                     type="text"
                     size='large'
                     allowClear={true}
                     id="new-todo"
                     value={newTodo}
                     onChange={(e) => setNewTodo(e.target.value)}
                     placeholder="Введите текст"
                  />
               </Form.Item>
               <Button size='large' type='primary' htmlType='submit'>
                  Добавить
               </Button>
            </Form>
         </Card>
      </>

   )
   let content
   if (isLoading) {
      content = <Paragraph>Loading...</Paragraph>
   } else if (isError) {
      content = <Paragraph>Произошла ошибка</Paragraph>
   } else {
      content = (
         <>
            <Title level={2}>Список дел</Title>
            <Card hoverable>
               <DragDropContext onDragEnd={(result) => {
                  if (!result?.destination) return
                  if (todos) {
                     const tasks = [...todos]
                     const [reorderedItem] = tasks.splice(result.source.index, 1)
                     tasks.splice(result.destination.index, 0, reorderedItem)
                     const idsOrderArray = tasks.map(task => task.id)
                     localStorage.setItem(`taskOrder${page}`, JSON.stringify(idsOrderArray))
                     setTodos(tasks)
                  }
               }}>
                  <Droppable droppableId='todos'>
                     {(provided) => (
                        <section {...provided.droppableProps} ref={provided.innerRef}>
                           <List size='large'
                              pagination={{
                                 onChange: (page) => { setPage(page) },
                                 total: totalCountRef.current,
                                 pageSize: 10,
                                 position: 'both',
                                 showSizeChanger: false
                              }}
                           >
                              {todos?.map((todo, index) => {
                                 return (
                                    <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                                       {(provided) => (
                                          <article {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} className="todo">
                                             <List.Item>
                                                <Checkbox
                                                   type="checkbox"
                                                   checked={todo.completed}
                                                   id={todo.id}
                                                   onChange={() =>
                                                      updateTodoMutation.mutate({ ...todo, completed: !todo.completed })
                                                   }
                                                />
                                                <Text type={todo.completed ? 'success' : 'danger'}>{todo.title}</Text>
                                                <Button danger type='primary' icon={<AiOutlineDelete />} onClick={() => handleDelete(todo.id)} />
                                             </List.Item>
                                          </article>
                                       )}
                                    </Draggable>
                                 )
                              })
                              }
                              {provided.placeholder}
                           </List>
                        </section>
                     )}
                  </Droppable>
               </DragDropContext>
            </Card>
         </>

      )
   }

   return (
      <>
         {newItemSection}
         {content}
      </>
   )
}

export default TodoList