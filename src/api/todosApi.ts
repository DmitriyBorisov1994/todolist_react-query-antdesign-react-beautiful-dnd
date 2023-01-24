import axios from "axios";
import { Todo } from "../utils/types";

const todosApi = axios.create({
   baseURL: `https://jsonplaceholder.typicode.com`//http://localhost:3500`
})

export const getTodos = async (pageParam: number) => {
   const response = await todosApi.get<Todo[], any>(`/todos?_page=${pageParam}`)
   return { data: response.data as Todo[], totalCount: response.headers["x-total-count"] as any }
}

export const addTodo = async (todo: Todo) => {
   return await todosApi.post("/todos", todo)
}

export const updateTodo = async (todo: Todo) => {
   return await todosApi.patch(`/todos/${todo.id}`, todo)
}

type DeleteTodoParams = {
   id: string
}
export const deleteTodo = async ({ id }: DeleteTodoParams) => {
   return await todosApi.delete(`/todos/${id}`, id as any)
}

export default todosApi 