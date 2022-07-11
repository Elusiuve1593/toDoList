import {v1} from 'uuid';
import {ResponseType, todolistsAPI, TodolistType} from '../api/todolists-api'
import {Dispatch} from "redux";
import {AppActionsType, RequestStatusType, setAppStatus, setError} from "./app-reducer";

const initialState: Array<TodolistDomainType> = [
    /*{id: todolistId1, title: 'What to learn', filter: 'all', addedDate: '', order: 0},
    {id: todolistId2, title: 'What to buy', filter: 'all', addedDate: '', order: 0}*/
]

export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType,
    status: RequestStatusType
}

export const todolistsReducer = (state: Array<TodolistDomainType> = initialState, action: ActionsType): ({ filter: string; addedDate: string; id: string; title: TodolistType; order: number } | TodolistDomainType)[] => {
    switch (action.type) {
        case 'REMOVE-TODOLIST': {
            return state.filter(tl => tl.id !== action.todolistId)
        }
        case 'ADD-TODOLIST': {
            return [{
                id: action.todolistId,
                title: action.title,
                filter: 'all',
                addedDate: '',
                order: 0,
                status: "idle"
            }, ...state]
        }
        case 'CHANGE-TODOLIST-TITLE': {
            const todolist = state.find(tl => tl.id === action.id);
            if (todolist) {
                // если нашёлся - изменим ему заголовок
                todolist.title = action.title;
            }
            return [...state]
        }
        case 'CHANGE-TODOLIST-FILTER': {
            const todolist = state.find(tl => tl.id === action.id);
            if (todolist) {
                // если нашёлся - изменим ему заголовок
                todolist.filter = action.filter;
            }
            return [...state]
        }
        case "SET-TODOLISTS": {
            return action.todolists.map(i => (
                {
                    ...i,
                    filter: "all",
                    status: "idle",
                }
            ))
        }
        case "TODOLIST_REDUCER/DISABLE_TODOLIST": {
            return state.map(tl => tl.id === action.id ? {...tl, status: 'loading'} : tl)
        }
        default:
            return state;
    }
}

type ActionsType = RemoveTodolistActionType
    | AddTodolistActionType
    | ChangeTodolistTitleActionType
    | ChangeTodolistFilterActionType
    | setTodoListsACType
    | AppActionsType
    | changeTodolistEntityStatusType


export type RemoveTodolistActionType = ReturnType<typeof removeTodolistAC>
export type AddTodolistActionType = ReturnType<typeof addTodolistAC>
export type ChangeTodolistTitleActionType = ReturnType<typeof changeTodolistTitleAC>
export type ChangeTodolistFilterActionType = ReturnType<typeof changeTodolistFilterAC>
export type setTodoListsACType = ReturnType<typeof setTodoListsAC>
export type changeTodolistEntityStatusType = ReturnType<typeof changeTodolistEntityStatusAC>
export const setTodoListsAC = (todolists: TodolistType[]) => {
    return {
        type: 'SET-TODOLISTS',
        todolists
    } as const
}

export const setTodoListsTHunk = () => {
    return (dispatch: Dispatch) => {
        dispatch(setAppStatus('loading'))
        todolistsAPI.getTodolists()
            .then((res) => {
                dispatch(setTodoListsAC(res.data))
                dispatch(setAppStatus('succeeded'))
            })
    }
}

export const changeTodolistEntityStatusAC = (status: RequestStatusType, id: string) => {
    return {
        type: "TODOLIST_REDUCER/DISABLE_TODOLIST",
        status, id
    } as const
}

export const removeTodolistAC = (todolistId: string) => {
    return {type: 'REMOVE-TODOLIST', todolistId} as const
}

export const removeToDoList = (todolistId: string) => {
    return (dispatch: Dispatch) => {
        dispatch(changeTodolistEntityStatusAC("loading", todolistId))
        todolistsAPI.deleteTodolist(todolistId)
            .then((res) => {
                if (res.data.resultCode === 0) {
                    dispatch(removeTodolistAC(todolistId))
                    dispatch(setAppStatus('succeeded'))
                } else {
                    dispatch(setError(res.data.messages[0]))
                    dispatch(setAppStatus('failed'))
                    dispatch(changeTodolistEntityStatusAC("failed", todolistId))
                }
            })
    }
}

export const addTodolistAC = (title: string) => {
    return {type: 'ADD-TODOLIST', title, todolistId: v1()} as const
}

export const addTodolistThunk = (title: string) => {
    return (dispatch: Dispatch) => {
        dispatch(setAppStatus('loading'))
        todolistsAPI.createTodolist(title)
            .then((res) => {
                if (res.data.resultCode === 0) {
                    dispatch(addTodolistAC(res.data.data.item.title))
                } else {
                    dispatch(setError(res.data.messages[0]))
                }
            })
            .finally(() => {
                dispatch(setAppStatus('idle'))
            })
    }
}

export const changeTodolistTitleAC = (id: string, title: string) => {
    return {type: 'CHANGE-TODOLIST-TITLE', id, title} as const
}

export const changeTodolistTitle = (id: string, title: string) => {
    return (dispatch: Dispatch) => {
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(changeTodolistTitleAC(id, title))
            })
    }
}
export const changeTodolistFilterAC = (id: string, filter: FilterValuesType) => {
    return {type: 'CHANGE-TODOLIST-FILTER', id: id, filter: filter} as const
}