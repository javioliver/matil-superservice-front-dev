//REACT
import { useEffect, useState, KeyboardEvent } from 'react'
import { useAuth } from './AuthContext'
import { BrowserRouter as Router } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import CryptoJS from 'crypto-js'
import axios, { AxiosError, isAxiosError } from 'axios'
//FRONT
import { Flex, Box, Stack, Button, ChakraProvider, extendTheme, Text,cssVar, defineStyleConfig, Icon } from '@chakra-ui/react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import showToast from './Content/Components/ToastNotification'
//CONTENT
import Content from './Content/Content'
//COMPONENTS
import LoadingIcon from './Content/Components/LoadingIcon'
import FloatingLabelInput from './Content/Components/FormInputs'
//ICONS
import { IoPersonCircleOutline } from "react-icons/io5"
import { MdOutlineMailOutline, MdLockOutline } from "react-icons/md"
import { TbArrowBack } from 'react-icons/tb'
import { TiFlowMerge } from "react-icons/ti"
//TYPING
import { userInfo, Organization } from './Content/Constants/typing'

//ENVIORMENT VARIABLES
const URL = import.meta.env.VITE_PUBLIC_API_URL
const TOKENS_KEY = import.meta.env.VITE_ENCRIPTION_KEY || 'DEFAULT-KEY'

//SKELETON THEME
const $startColor = cssVar('skeleton-start-color')
const $endColor = cssVar('skeleton-end-color')
const customVariant = {
  [$startColor.variable]: 'colors.transparent',
  [$endColor.variable]: 'colors.gray.200'}
const skeletonTheme = defineStyleConfig({baseStyle: customVariant})

//CUSTOM THEME
const theme = extendTheme({
    breakpoints: {
      sm: '450px',
      md: '700px',
      lg: '960px',
      xl: '1200px'
    },
    colors: {
      brand: {
        clear_black: '#1A202C', 
        gray: '#4A5568',
        hover_gray:'#F2F5F9',
        gradient_blue:'linear-gradient(to right, rgba(0, 102, 204, 1),rgba(51, 153, 255, 1))',
        gradient_blue_hover:'linear-gradient(to right, rgba(0, 72, 204, 1),rgba(51, 133, 255, 1))'
       }
     },
    styles: {
      global: {
        body: {
          bg: 'gray.50',
          fontFamily: 'Jost, sans-serif'
        }
      }
    },
    components: {
      Button: { baseStyle: {fontWeight:'medium',   bg: "#BCC0C4", }},
      Skeleton: skeletonTheme,
      Radio: {
        baseStyle: {control: {borderRadius: "full"}},
        variants: {
          custom: {
            control: {
              bg: "white", 
              borderColor: "blue.500",
              _checked: {
                bg: "blue.500",
                borderColor: "blue.500",
                color: "white",
              }
            }
          }
        }
      }
    }
  })
   
//REGEX FOR PASSWORD AND MAIL
const passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{8,}$/
const mailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/

//MAIN FUNCTION
const App: React.FC = () => { 

    //TRANSLATION
    const { t } = useTranslation('login')

     //AUTH DATA
    const { authData, setAuthData, signIn, signOut, isSignedIn } = useAuth()

    //USER CONFIGURATIONS AND WAIT BOOLEAN
    const [waitingInfo, setWaitingInfo] = useState<boolean>(true)
    const currentOrganizationName = localStorage.getItem('currentOrganization')
    const [userInfo, setUserInfo] = useState<userInfo>({name:'',surname:'', organizations:[]})

    //REGISTER VARIABLES
    const [showCode, setShowCode] = useState<boolean>(false)
    const [registerName, setRegisterName] = useState<string>('')
    const [registerSurname, setRegisterSurname] = useState<string>('')
    const [registerMail, setRegisterMail] = useState<string>('')
    const [registerPassword, setRegisterPassword] = useState<string>('')
    const [registerPassword2, setRegisterPassword2] = useState<string>('')

    //LOGIN VARIABLES
    const [usernameLogin, setUsernameLogin] = useState<string>('')
    const [passwordLogin, setPasswordLogin] = useState<string>('')
    const [passwordErrorLogin, setPasswordErrorLogin] = useState<string>('')

    //SIGN IN AND REGISTER FUNCTION
    const handleSignIn = async () => {
       if (showCode) {
        try {
          const response = await axios.post(URL + 'user', {'name':registerName, 'surname':registerSurname, 'email':registerMail, 'password':registerPassword})
          showToast({message:'Cuenta registrada con éxito'})
          setShowCode(false)
        }
        catch (error) {showToast({message:'Hubo un error el el registro', type:'failed'})}}
      else{
         try {
          const response = await axios.post(URL + 'user/login', {email: usernameLogin, password: passwordLogin})
          setAuthData({email:usernameLogin, accessToken:response.data.access_token, refreshToken:response.data.refresh_token})
          fetchData(response.data.access_token, response.data.refresh_token,usernameLogin)
          const encryptedAccessToken = CryptoJS.AES.encrypt(response.data.access_token, TOKENS_KEY).toString();
          const encryptedRefreshToken = CryptoJS.AES.encrypt(response.data.refresh_token, TOKENS_KEY).toString();
        
          localStorage.setItem('accessToken', encryptedAccessToken)
          localStorage.setItem('refreshToken', encryptedRefreshToken)
          localStorage.setItem('mail', usernameLogin)
        } catch (error: unknown) {
          if (error instanceof AxiosError) setPasswordErrorLogin(error?.response?.data.message)
          else setPasswordErrorLogin('Ocurrió un error desconocido')
        }  
      }
    }

    //FUNCTION TO FETCH INITIAL USER DATA
    const fetchData = async ( accessToken:string, refreshToken:string, email:string ) => {

        const fetchInitialOrgData = async (user:{id:number, name:string, surname:string, organizations:Organization[]}, accessToken:string) => {
          let superserviceOrganization
          if (currentOrganizationName) {superserviceOrganization = user.organizations.find((org: Organization) => org.platform_type === 'superservice' && org.id === parseInt(currentOrganizationName))}
          if (!superserviceOrganization) {superserviceOrganization = user.organizations.find((org: Organization) => org.platform_type === 'superservice')}
          if (superserviceOrganization) {
            setAuthData({ organizationId: superserviceOrganization.id, userId:user.id, organizationName:superserviceOrganization.name ,email:email, accessToken:accessToken, refreshToken:refreshToken })
            localStorage.setItem('currentOrganization', String(superserviceOrganization.id))
            try{
              const responseOrg = await axios.get(URL + `superservice/${superserviceOrganization.id}/user`, {headers: {'Authorization': `Bearer ${accessToken}`}})

              const viewsToAdd = {
                number_of_tickets_in_bin:responseOrg.data.number_of_tickets_in_bin, 
                private_views:responseOrg.data.private_views, 
                number_of_tickets_per_private_view:responseOrg.data.number_of_tickets_per_private_view,
                shared_views:responseOrg.data.shared_views, 
                number_of_tickets_per_shared_view:responseOrg.data.number_of_tickets_per_shared_view
              }
              setAuthData({views: viewsToAdd, users:responseOrg.data.users, shortcuts:responseOrg.data.shortcuts, ticket_subjects:responseOrg.data.ticket_subjects})
            }
            catch (error){console.log(error)}
          }
          
          else setAuthData({ organizationId: null, email:email, userId:user.id, accessToken:accessToken, views:{'private_views':[], 'shared_views':[]}, users:null, shortcuts:[], ticket_subjects:[]})
          
          setUserInfo({name:user.name, surname:user.surname, organizations:user.organizations})
          signIn()
          setUsernameLogin('')
          setPasswordLogin('')
          setWaitingInfo(false)
        }

        try {
          const response = await axios.get(URL + `user`, {headers: {'Authorization': `Bearer ${accessToken}`}})
          fetchInitialOrgData(response.data, accessToken)
        } 
        catch (error) {
          if (isAxiosError(error) && error.response && error.response.status === 403){
            try {
                const accessResponse = await axios.get(URL + 'user/refresh_token', {headers: {'Authorization': `Bearer ${refreshToken}`}})
             
                setAuthData({accessToken:accessResponse.data.access_token})
                const encryptedAccessToken = CryptoJS.AES.encrypt(accessResponse.data.access_token, TOKENS_KEY).toString()
                localStorage.setItem('accessToken', encryptedAccessToken)
                const new_response = await axios.get(URL + `user`, {headers: {'Authorization': `Bearer ${accessResponse.data.access_token}`}})
                fetchInitialOrgData(new_response.data, accessResponse.data.access_token)
            }
            catch (error) {
                  signOut()
                  setWaitingInfo(false)
                  setUsernameLogin('')
                  setPasswordLogin('')
            }
          }
        }
      }
      
    //INITIAL REQUEST TO CLIENT DATA IF MAIL IS STORED IN LOCALSOTRAGE, ELSE WILL SEND YOU TO LOGIN
    useEffect(() => {
      setWaitingInfo(true)
      const storedMail = localStorage.getItem('mail')
      const storedAccessToken = localStorage.getItem('accessToken')
      const storedRefreshToken = localStorage.getItem('refreshToken')

      if (storedMail && storedAccessToken && storedRefreshToken) {
        const encryptedAccessToken = CryptoJS.AES.decrypt(storedAccessToken, TOKENS_KEY).toString(CryptoJS.enc.Utf8)
        const encryptedRefreshToken = CryptoJS.AES.decrypt(storedRefreshToken, TOKENS_KEY).toString(CryptoJS.enc.Utf8)
         if (storedMail !== null && encryptedAccessToken !== null && encryptedRefreshToken !== null) fetchData(encryptedAccessToken, encryptedRefreshToken,storedMail)
      }
      else setWaitingInfo(false)
    }, [])
      
    //SIGN IN ON KEY DOWN
    const handleKeyDown = ( event:KeyboardEvent ) => {if (event.key === 'Enter') handleSignIn()}

    //APP CONTENT
    return (  
      <ChakraProvider theme={theme}>
        {waitingInfo ?   
          <Flex height={'100vh'}  width={'100vw'} justifyContent={'center'} alignItems={'center'}> 
              <LoadingIcon/>
          </Flex>:
          <>
              {(isSignedIn && authData.accessToken && ((authData.views && authData.users) || !authData.organizationId))?
                <Router> 
                  <Content userInfo={userInfo} />
                  <ToastContainer />
                </Router>:
                <>
                  <Flex justifyContent={'center'} alignItems={'center'} height={'100vh'} width={'100vw'} bg='linear-gradient(to right, #C6D8FE, #93B6FF)'> 
                    <Box width={'400px'} boxShadow={'0 0 10px 1px rgba(0, 0, 0, 0.09)'} borderRadius={'1em'} bg='white' zIndex={100} p={'40px'} >
                      <Text textAlign={'center'} fontWeight={'medium'} fontSize={'1.6em'} color='gray.600'>{showCode?t('SignUp'):t('SignIn')}</Text>
                         <Stack spacing={'2vh'} color='color.500' mt='6vh'>
                          {showCode?
                            <>  
                                <FloatingLabelInput leftIcon={IoPersonCircleOutline} value={registerName} setValue={setRegisterName }maxLength={100} placeholder={t('Name')}/>
                                <Box mt='3vh'>
                                  <FloatingLabelInput leftIcon={IoPersonCircleOutline} value={registerSurname} setValue={setRegisterSurname}maxLength={100} placeholder={t('Surname')}/>
                                </Box>

                                <Box mt='3vh'>
                                  <FloatingLabelInput regex={mailRegex} leftIcon={MdOutlineMailOutline} value={registerMail} setValue={setRegisterMail}  maxLength={100}placeholder={t('Mail')}/>
                                </Box>

                                <Box mt='3vh'>
                                  <FloatingLabelInput isPassword={true} regex={passwordRegex} leftIcon={MdLockOutline} value={registerPassword} setValue={setRegisterPassword} maxLength={100} placeholder={t('Password')}/>
                                </Box>

                                <Box mt='3vh' mb='2vh'>
                                  <FloatingLabelInput isPassword={true} regex={passwordRegex} leftIcon={MdLockOutline} value={registerPassword2} setValue={setRegisterPassword2} maxLength={100} placeholder={t('Repeat') + ' ' +  t('Password').toLocaleLowerCase()}/>
                                </Box>
                            </> 
                            :
                            <form onKeyDown={handleKeyDown} autoComplete='off'> 
                              <FloatingLabelInput  leftIcon={MdOutlineMailOutline} value={usernameLogin} setValue={setUsernameLogin} placeholder={t('Mail')}/>            
                              <Box mt='5vh' mb='2vh'>
                                <FloatingLabelInput isPassword={true} leftIcon={MdLockOutline} value={passwordLogin} setValue={setPasswordLogin} placeholder={t('Password')}/>
                              </Box>
                            </form>
                            }
                           {passwordErrorLogin && (
                            <Text color="red" mt={1}>
                              {passwordErrorLogin}
                            </Text>
                              )}
                            <Button px='25px' width='fit-content'fontWeight={'medium'} isDisabled={showCode ?(registerName === '' || registerSurname === '' || registerMail === '' || registerPassword === '' || (registerPassword !== registerPassword2) || !mailRegex.test(registerMail) || !passwordRegex.test(registerPassword)) : (usernameLogin === '' || passwordLogin === '')} display={'inline-flex'} fontStyle={'jost'} borderRadius={'2rem'} color='white'   onClick={handleSignIn} bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}}>
                              {showCode?'Registrarse':'Iniciar sesión'}
                            </Button>
                     
                          {showCode ? 
                          <Flex  mt='1vh' onClick={() => setShowCode(false)} alignItems={'center'} gap='5px' color='#1a73e8' cursor={'pointer'}  width='fit-content'> 
                            <Icon as={TbArrowBack} mt='2px'/>
                            <Text fontSize={'.9em'} >{t('Return')}</Text>
                          </Flex>
                          :
                          <Text mt='1vh' fontSize={'.9em'} >{t('Account')} <span onClick={() => setShowCode(true)} style={{color:'#1a73e8', cursor:'pointer'}} >{t('SignUp')}</span></Text>
                          }
                      </Stack>
                    </Box>
                  </Flex>
                  <ToastContainer/>
                </>
              }
          </>}         
      </ChakraProvider>
    ) 
 
}

export default App

