import React from 'react';
import { Box, Button, Step, StepDescription, StepIcon, StepIndicator, StepNumber, StepSeparator, StepStatus, StepTitle, Stepper, Text, VStack, useColorModeValue, useSteps } from '@chakra-ui/react';
import JoinGraveBtn from './JoinGraveBtn';

const JoinGravePannel: React.FC = () => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');

  const steps = [
    { title: 'Give your 🆙 necessary permissions', description: 'Give permissions to your Browser Extension Controller.', description2: 'This can also be done manually.' },
    { title: 'Create your GRAVE spam box', description: ' '},
    { title: 'Link GRAVE to your 🆙'},
    { title: 'Enable GRAVE to keep assets inventory' },
    { title: 'Direct all 🆙 spam to the GRAVE' },
  ]

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })

  return (
    <VStack
      spacing={4}
      p={5}
      backgroundColor={bgColor}
      boxShadow='md'
      borderRadius='lg'
      width='500px'
      textAlign='center'
      padding='20px'
      h='400px'
      color={useColorModeValue('black', 'black')}
    >
      <Text fontSize='2xl' fontWeight='bold' fontFamily='Roboto' >
        SET UP YOUR GRAVE SPAM BOX
      </Text>
      < JoinGraveBtn onJoiningStepChange={(newStep: number) => {setActiveStep(newStep)} } />
          <Stepper index={activeStep} orientation='vertical' height='200px' gap='2' id='grave-step-indicator'>
            {steps.map((step, index) => (
                <Step key={index}  >
                <StepIndicator color='dark.purple.500' borderColor='dark.purple.500' >
                    <StepStatus  
                    complete={'🪦'}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                    />
                </StepIndicator >
                <Box flexShrink='0' textAlign={'left'}>
                    <StepTitle style={{color: 'dark.purple.500'}}>{step.title}</StepTitle>
                    <StepDescription >{step.description}</StepDescription>
                    <StepDescription >{step.description2}</StepDescription>
                </Box>
                <StepSeparator style={{color: 'dark.purple.500', backgroundColor: 'dark.purple.500'}} />
                </Step>
            ))}
            </Stepper>
    </VStack>
  );
};

export default JoinGravePannel;
