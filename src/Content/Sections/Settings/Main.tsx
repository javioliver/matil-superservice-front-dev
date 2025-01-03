
//REACT
import  { Fragment, useEffect } from 'react'
import { useNavigate } from "react-router-dom" 
import { useAuth } from '../../../AuthContext'
import { useTranslation } from 'react-i18next'
//FRONT
import { Flex, Text, Box, Icon, Grid } from "@chakra-ui/react"
//ICONS
import { IconType } from "react-icons"
//TYPING
import { IconKey, SubSectionProps } from "../../Constants/typing"
 
interface MainProps {
    subSections: SubSectionProps[]
    sectionsList: (IconKey | '')[] 
    subSectionsMap:{[key:string]: [string, IconType]}
}
interface SectionBoxProps {
    section: IconKey
    subSections: SubSectionProps
 }
export type SectionsListProps = {[key in IconKey]: [string, string]}

//MAIN FUNCTION
function Main ({subSections, sectionsList, subSectionsMap}:MainProps) {
   
    //TRANSLATION
    const { t } = useTranslation('settings')
    
    const auth = useAuth()
    useEffect (() => {
        document.title = `${t('Settings')} - ${t('Main')} - ${auth.authData.organizationName} - Matil`
    }, [])

    //COMPONENT FOR EACH BOX SECTION
    const SectionBox = ({section, subSections}:SectionBoxProps) => {

        //CONSTANTS
        const sectionsMap:SectionsListProps = {'organization':[t('Organization'),'blue.200' ], 'users':[t('User'), 'green.200'], 'support':[t('Support'), 'cyan.200'],  'workflows':[t('Workflows'), 'orange.200'],  'actions':[t('Actions'), 'yellow.200'], 'channels': [t('Channels'), 'purple.200'], 'integrations':[t('Integrations'), 'red.200'], 'main':[t('Main'), '#FF69B4']}
        const navigate = useNavigate()

        return(
            <Box mt='3vh' width={'100%'}   maxW={'1100px'}> 
                <Text fontSize={'1.4em'} fontWeight={'medium'}>{sectionsMap[section][0]}</Text>
                <Grid  mt='1vh' width={'100%'} gap={'20px'} justifyContent={'space-between'} templateColumns='repeat(3, 1fr)'> 
                    {subSections.map((sec, index) => {
                        return (
                        <Flex gap='10px' p='20px' alignItems={'center'}transition={'box-shadow 0.3s ease-in-out'} _hover={{shadow:'lg'}} borderRadius={'.5rem'} key={`subsection-${section}-${index}`} shadow='sm' borderWidth={'1px'} borderColor={'gray.100'} cursor={'pointer'}  onClick={() => {navigate(`/settings/${section}/${sec[1]}`);localStorage.setItem('currentSettingsSection',`${section}/${sec[1]}`)}} >
                            <Flex height={'44px'}  bg={sectionsMap[section][1]} justifyContent={'center'} alignItems={'center'} borderRadius={'.7rem'} p='14px' >
                                <Icon  boxSize={'16px'} as={subSectionsMap[sec[1]][1]}/>
                            </Flex>
                            <Box> 
                                <Text fontWeight={'medium'}  >{sec[0]}</Text>
                                <Text color='gray.600' fontSize={'.8em'} >{subSectionsMap[sec[1]][0]}</Text>
                            </Box>
                        </Flex>)
                    })}
                </Grid>
                
            </Box>
        )
    }
  
    return(
    <Box flex='1' overflow={'scroll'}>       
        <Text fontSize={'1.6em'} fontWeight={'semibold'} >{t('Main')}</Text>
        <Flex py='3vh' alignItems={'center'} flexDir={'column'}  > 
            {sectionsList.map((section, index) => 
                (<Fragment key={`settings-section-${index}`} > 
                    {section !== '' && <SectionBox  section={section} subSections={subSections[index]} />}
                </Fragment>))}
        </Flex>
    </Box>)
}

export default Main