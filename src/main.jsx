import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { library } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import {
  faBars, faSliders, faPlus, faPaste, faCheck,
  faArrowLeft, faCopy, faFloppyDisk, faFileImport, faFilePdf, faTrash,
  faTableColumns, faList, faXmark, faGripVertical,
  faPen, faEye, faShareNodes,
} from '@fortawesome/pro-solid-svg-icons'
import './index.css'
import App from './App.jsx'

library.add(
  faBars, faSliders, faPlus, faPaste, faCheck,
  faArrowLeft, faCopy, faFloppyDisk, faFileImport, faFilePdf, faTrash,
  faTableColumns, faList, faXmark, faGripVertical,
  faPen, faEye, faShareNodes,
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
