import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n.js'
import { AuthProvider } from './AuthContext'
import { SessionProvider } from './SessionContext'
import ReactFlow, { ReactFlowProvider, Controls, Background, useReactFlow } from 'reactflow';


const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <AuthProvider> 
        <SessionProvider> 
            <ReactFlowProvider> 
                <App/>
            </ReactFlowProvider>
        </SessionProvider>
    </AuthProvider>
)
 