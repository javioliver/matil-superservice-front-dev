//ICONS
import { IconType } from "react-icons"
import { IoMdMail, IoLogoWhatsapp } from "react-icons/io"
import { IoChatboxEllipses, IoLogoGoogle } from "react-icons/io5"
import { AiFillInstagram } from "react-icons/ai"
import { FaPhone } from "react-icons/fa"

//USER INFO AND ORGANIZATION
export interface Organization {
    id: number
    name: string
    platform_type: string
    is_admin: boolean
  }
export interface userInfo {
    name: string
    surname: string
    organizations: Organization[]
}

//VIEWS
interface Condition {
    column: TicketColumn
    operation_type: 'geq' | 'leq' | 'eq'
    value: any
}
interface Order {
    column: TicketColumn
    order: string
}
export interface View {
    created_at:string
    name: string
    columns: TicketColumn[]
    all_conditions: Condition[]
    any_conditions: Condition[]
    order_by: Order
}
export interface Views {
    private_views: View[]
    shared_views: View[]
    number_of_tickets_per_shared_view?:number[]
    number_of_tickets_per_private_view?:number[]
    number_of_tickets_in_bin?:number
}
export interface ViewType {type:'private' | 'shared' | 'deleted', index:number, name:string}

//HEADER SECTIONS
export type HeaderSectionType = (description: string, code: number, section: 'ticket' | 'client' | 'contact-business', local_id?:number) => void
export type DeleteHeaderSectionType = (element:{description: string, code: number, local_id?:number, type: string}) => void


//TICKETS TABLE
export type TicketColumn = 
    'id'
  | 'local_id'
  | 'user_id'
  | 'channel_type'
  | 'created_at'
  | 'updated_at'
  | 'solved_at'
  | 'title'
  | 'subject'
  | 'urgency_rating'
  | 'status'
  | 'deletion_date'
  | 'unseen_changes'
  | 'closed_at'

  

type ColumnsTicketsMap = {[key in TicketColumn]: number}
  
export const columnsTicketsMap: ColumnsTicketsMap = {
    id: 50,
    local_id: 50 ,
    status:  100,
    channel_type: 150,
    subject:  200,
    user_id: 200,
    created_at: 150,
    updated_at: 150,
    solved_at: 150,
    closed_at: 150,
    title: 300,
    urgency_rating: 130,
    deletion_date: 180,
    unseen_changes: 250,
  }

export interface TicketsTableProps {
    'id': number
    'local_id': number
    [key:string]: number | string | boolean
 }
export interface Tickets {
    'total_tickets':number
    'page_index':number
    'page_data':TicketsTableProps[]
    'ticket_ids'?:number[]
}
export interface ClientTicketsProps{
    'status':'new' | 'open' |'solved' | 'pending' | 'closed'
    'created_at':string
    'title':string
}

//TICKET SECTION
export interface TicketData {
    'id': number
    'local_id': number
    'user_id':number
    'conversation_id': number
    'title': string
    'channel_type': string
    'created_at': string
    'updated_at': string
    'solved_at': string
    'subject': string
    'urgency_rating': number
    'status': 'new' | 'open' |'solved' | 'pending' | 'closed'
    'unseen_changes': boolean
}


//CLIENTS TABLE
export type ClientColumn = 
  | 'id'
  | 'organization_id'
  | 'contact_business_id'
  | 'created_at'
  | 'name'
  | 'language'
  | 'waba_id'
  | 'phone_number'
  | 'email_address'
  | 'instagram_username'
  | 'google_business_review_id'
  | 'webchat_uuid'
  | 'last_interaction_at'
  | 'rating'
  | 'notes'
  | 'labels'
  | 'is_blocked'


interface ColumnsMap {
    [key:string]: number;
}

export const columnsClientsMap: ColumnsMap = {
    name: 200,
    contact: 150,
    labels: 350,
    last_interaction_at: 150,
    created_at: 150,
    rating: 60,
    language: 150,
    notes: 350,
    is_blocked: 150
 }

 export const languagesFlags: {[key: string]: [string, string]} = {
    "EN": ["Inglés", "🇬🇧"], 
    "ES": ["Español", "🇪🇸"],  
    "EU": ["Euskera", "🇪🇸"],  
    "CA": ["Catalán", "🇪🇸"],  
    "GL": ["Gallego", "🇪🇸"],  
    "ZH": ["Chino Mandarín", "🇨🇳"],  
    "HI": ["Hindú", "🇮🇳"], 
    "AR": ["Árabe", "🇸🇦"],  
    "FR": ["Francés", "🇫🇷"],  
    "RU": ["Ruso", "🇷🇺"],  
    "PT": ["Portugués", "🇵🇹"], 
    "DE": ["Alemán", "🇩🇪"], 
    "JA": ["Japonés", "🇯🇵"],  
    "IT": ["Italiano", "🇮🇹"], 
    "KO": ["Coreano", "🇰🇷"], 
    "TR": ["Turco", "🇹🇷"],  
    "VI": ["Vietnamita", "🇻🇳"], 
    "BN": ["Bengalí", "🇧🇩"], 
    "ID": ["Indonesio", "🇮🇩"], 
    "SV": ["Sueco", "🇸🇪"],  
    "NL": ["Holandés", "🇳🇱"], 
    "EL": ["Griego", "🇬🇷"], 
    "HE": ["Hebreo", "🇮🇱"],  
    "UNKNOWN":["No reconocido", "🏴"]
}


export interface ClientData {
    id:number
    contact_business_id: number
    name: string
    language: string
    phone_number?: string
    email_address?: string
    instagram_username?: string
    webchat_uuid?:string
    google_business_id?:string
    rating: number
    last_interaction_at: string
    created_at: string
    notes: string
    labels: string
    is_blocked:boolean
  }
export interface Clients {
    'total_clients':number
    'page_index':number
    'page_data':ClientData[]
}

//CONTACT BUSINESSSES TABLE
export const columnsBusinessesMap: ColumnsMap = {
    name: 200,
    labels:  350,
    created_at:  150,
    last_interaction_at:  150,
    notes: 350,
 }

export interface ContactBusinessesTable {
    'id':number
    'name': string
    'domain':string
    'labels': string
    'created_at':string
    'last_interaction_at': string
    'notes': string
  }

export interface ContactBusinessesProps {
    'total_contact_businesses':number
    'page_data':ContactBusinessesTable[]
}
export interface ContactBusiness {
    'name': string
    'notes': string
    'labels': string
    'created_at':string
    'last_interaction_at': string
}

//FLOWS
export type FlowsColumn = 
  | 'id'
  | 'name'
  | 'description'
  | 'status'
  | 'channel'
  | 'created_at'
  | 'updated_at'
export interface FlowsData {
    id:number
    name: string
    description:string
    status: 'active' | 'inactive' | 'draft'
    channel: Channels
    created_at:string
    updated_at:string
  }
export interface Flows {
    'total_flows':number
    'page_index':number
    'page_data':FlowsData[]
}
export const columnsFlowsMap: ColumnsMap = {
    name: 200,
    description:  350,
    status: 150,
    channel: 150,
    created_at:  150,
    updated_at: 150
 }
export type nodeTypesDefinition = 'extractor' | 'brancher' | 'sender' | 'function' | 'terminator' | 'transfer' | 'reset' | 'flow_swap' | 'motherstructure_updates'
export type actionTypesDefinition = 'message' | 'condition' | 'extract'
export type Branch = {
    name:string, 
    conditions:{variable_index:number, op:string, value:any}[],
    next_node_index:number
  }

//MESSAGES
export type MessagesProps = {
    id:number
    timestamp:string
    sender_type:number
    type:string
    content:any
}
export type MessagesData = {
    messages:MessagesProps[]
    extracted_data:{[key:string]:any} |  null
    scheduled_messages:MessagesProps[]
}

//STATES MAP
export const statesMap:{[key in 'new' | 'open' |'solved' | 'pending' | 'closed']: [string, string]} = 
{
    'new':['gray.400', 'gray.500'],
    'open':['red.500', 'red.600'],
    'pending':['blue.500', 'blue.600',],
    'solved':['green.400', 'green.500'],
    'closed':['gray.700', 'gray.800']
}

//FILTERS AND MAPPING
export type Channels = 'email' | 'whatsapp' | 'instagram' | 'webchat' | 'google_business' | 'phone'
export const logosMap:{[key in Channels]: [IconType, string]} = 
    {
        'email':[ IoMdMail, 'red.600'],
        'whatsapp':[IoLogoWhatsapp, 'green'], 
        'webchat':[IoChatboxEllipses, 'cyan.400'], 
        'google_business':[ IoLogoGoogle, 'blue.400'],
        'instagram': [AiFillInstagram, 'pink.700'], 
        'phone':[ FaPhone, 'blue.400']

    }
export type ContactChannel = 'email_address' | 'phone_number' |  'instagram_username' | 'webchat_uuid' |  'google_business_id'
export const contactDicRegex:{[key in ContactChannel]:[string, RegExp, number, Channels]} = {
    'email_address': ['Mail', /^[\w\.-]+@[\w\.-]+\.\w+$/, 50, 'email'],
    'phone_number': ['Teléfono', /^\+?\d{1,15}$/, 16, 'whatsapp'],
    'instagram_username': ['Instagram', /^[a-zA-Z0-9._]{1,30}$/, 30, 'instagram'],
    'webchat_uuid': ['Web Id', /^[a-zA-Z0-9._-]{1,40}$/, 40, 'webchat'],
    'google_business_id':['Google Business', /^[a-zA-Z0-9._-]{1,40}$/, 40, 'google_business']
  }

//SETTINGS
export type IconKey = 'organization' | 'user' | 'rules' | 'channels' | 'integrations' | 'main'
export type SubSectionProps = string[][]
export type SectionsListProps = {[key in IconKey]: string}

//MATILDA CONFIGURATION PROPS
export interface configProps {
    is_matilda_enabled:boolean,
    is_restricted_to_business_days:boolean,
    answer_inmediately:boolean
    maximum_seconds_to_respond:string,
    minimum_seconds_to_respond:string
    business_day_end:number
    business_day_start:number
    business_days:number[]
    notify_about_agent_transfer:boolean
    agent_transfer_message:string
    out_of_business_agent_transfer_message: string
    ask_for_requirement_confirmation:boolean
}

//CONDITIONS TYPES
export type DataTypes = 'bool' | 'int' | 'float' | 'str' | 'timestamp' | 'list' | 'json'