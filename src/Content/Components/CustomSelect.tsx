/* 
    CUSTOM SELECTOR
*/

//REACT
import { useState, useRef, RefObject, CSSProperties } from 'react'
//FRONT
import { Flex, Text, Box, Icon, Portal } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import './styles.css'
//FUNCTIONS
import determineBoxStyle from '../Functions/determineBoxStyle'
import useOutsideClick from '../Functions/clickOutside'
//ICONS
import { IoIosArrowDown } from "react-icons/io"
import { FaCheck } from 'react-icons/fa'
import { IconType } from 'react-icons'

//TYPING
interface CustomSelectProps<T extends string | number>  {
    options: T[]
    selectedItem: T | undefined
    setSelectedItem: (key: T) => void
    hide:boolean
    updateData?: () => void
    labelsMap?: { [key in T]: string } | null
    iconsMap?: { [key in T]: [string, string | IconType] | [string, string | IconType, string]} | null
    containerRef?: RefObject<HTMLDivElement>
    isDisabled?:boolean
}

//MOTION BOX
const MotionBox = motion(Box)

//MAIN FUNCTION
const CustomSelect = <T extends string | number>({options, selectedItem, setSelectedItem, hide, updateData=() => {},  labelsMap=null ,iconsMap=null, containerRef, isDisabled = false}: CustomSelectProps<T>) => {

    //REFS
    const buttonRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)

    //BOOLEAN TO CONTROL THE VISIBILITY OF THE LIST AND CLOSE ON OUTSIDE CLICK
    const [showList, setShowList] = useState<boolean>(false)
    useOutsideClick({ref1:buttonRef, ref2:boxRef, containerRef, onOutsideClick:setShowList})

    //BOX POSITION LOGIC, TO SHOW IT UP OR DOWN OF THE INPUT, DEPENDING ON THE POSITION
    const [boxPosition, setBoxPosition] = useState<'top' | 'bottom'>('bottom')
    const [boxStyle, setBoxStyle] = useState<CSSProperties>({})
    determineBoxStyle({buttonRef, setBoxStyle, setBoxPosition, changeVariable:showList})


    //FRONT
    return(
        <Box position={'relative'}>
            <Flex bg={isDisabled ? 'gray.300':'transaprent'} cursor={isDisabled ? 'not-allowed':'pointer'} alignItems={'center'} ref={buttonRef} height={'37px'} fontSize={'.9em'}  onClick={()=>{if (!isDisabled) setShowList(!showList)}} border={showList ? "3px solid rgb(77, 144, 254)": hide ? "1px solid transparent": "1px solid #CBD5E0"} justifyContent={'space-between'} px={hide?showList?'5px':'7px':showList?'11px':'13px'} py={showList ? "5px" : "7px"} borderRadius='.5rem' _hover={{border:showList?'3px solid rgb(77, 144, 254)':'1px solid #CBD5E0'}}>
                <Text color={isDisabled ? 'gray.500':'black'}  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{(labelsMap && selectedItem !== undefined)?labelsMap[selectedItem]:iconsMap?.[selectedItem as T]?iconsMap[selectedItem][0]:selectedItem}</Text>
                <IoIosArrowDown className={showList ? "rotate-icon-up" : "rotate-icon-down"}/>
            </Flex>
            <AnimatePresence> 
                {showList && 
                    <Portal>
                        <MotionBox initial={{ opacity: 0, marginTop: boxPosition === 'bottom'?-10:10 }} animate={{ opacity: 1, marginTop: 0 }}  exit={{ opacity: 0,marginTop: boxPosition === 'bottom'?-10:10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                        top={boxStyle.top} bottom={boxStyle.bottom}right={boxStyle.right} width={boxStyle.width} maxH='40vh' overflow={'scroll'} gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                            {options.map((option:T, index:number) => (
                                <Flex key={`${selectedItem}-option-${index}`} px='10px'   py='7px' cursor={'pointer'} justifyContent={'space-between'} alignItems={'center'} color={selectedItem === option?'blue.500':'black'} _hover={{bg:'brand.hover_gray'}}
                                    onClick={() => {setSelectedItem(option as T); setShowList(false); setTimeout( () => updateData(), 0)}}>
                                    <Flex gap='10px' alignItems={'center'} > 
                                        {iconsMap && <>{(typeof(iconsMap[option][1]) === 'string') ? <Text>{iconsMap[option]?.[1] as string}</Text>:<Icon  color={iconsMap?.[option]?.[2]?iconsMap?.[option]?.[2]:''} as={iconsMap?.[option]?.[1] as IconType}/>}</>}
                                        <Text>{iconsMap?iconsMap[option][0]:labelsMap?labelsMap[option]:option}</Text>
                                    </Flex>
                                    {selectedItem === option && <Icon as={FaCheck} color={'blue.500'}/>}
                                </Flex>
                            ))}
                        </MotionBox>
                    </Portal>
                }
            </AnimatePresence>
        </Box>
    )
}

export default CustomSelect
