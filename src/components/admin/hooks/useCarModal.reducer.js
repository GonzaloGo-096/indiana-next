/**
 * useCarModal.reducer - Reducer simple para manejar el estado del modal de autos
 * 
 * @author Indiana Usados
 * @version 5.0.0 - Next.js compatible
 */

// ACCIONES DEL REDUCER
export const ACTIONS = {
  OPEN_CREATE_FORM: 'OPEN_CREATE_FORM',
  OPEN_EDIT_FORM: 'OPEN_EDIT_FORM',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// ESTADO INICIAL SIMPLE
export const initialCarModalState = {
  isOpen: false,
  mode: 'create', // 'create' | 'edit'
  initialData: null, // datos del auto para editar
  loading: false,
  error: null
}

// REDUCER SIMPLE
export const carModalReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.OPEN_CREATE_FORM:
      return {
        ...state,
        isOpen: true,
        mode: 'create',
        initialData: null,
        loading: false,
        error: null
      }

    case ACTIONS.OPEN_EDIT_FORM:
      return {
        ...state,
        isOpen: true,
        mode: 'edit',
        initialData: action.payload, // datos del auto
        loading: false,
        error: null
      }

    case ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        isOpen: false,
        mode: 'create',
        initialData: null,
        loading: false,
        error: null
      }

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: true,
        error: null
      }

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      }

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}

// ACTION CREATORS SIMPLES
export const openCreateForm = () => ({
  type: ACTIONS.OPEN_CREATE_FORM
})

export const openEditForm = (carData) => ({
  type: ACTIONS.OPEN_EDIT_FORM,
  payload: carData
})

export const closeModal = () => ({
  type: ACTIONS.CLOSE_MODAL
})

export const setLoading = () => ({
  type: ACTIONS.SET_LOADING
})

export const setError = (errorMessage) => ({
  type: ACTIONS.SET_ERROR,
  payload: errorMessage
})

export const clearError = () => ({
  type: ACTIONS.CLEAR_ERROR
})



