import React from 'react';
import {
  Box,
  Flex,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  VStack,
  useColorModeValue,
  useSteps,
} from '@chakra-ui/react';
import JoinGraveBtn from './JoinGraveBtn';
import { FaCheckCircle } from 'react-icons/fa';

const initialSteps = [
  {
    title: 'Give your 🆙 necessary permissions',
    instructions: 'Give permissions to your Browser Extension Controller.',
    instructions2: 'This can also be done manually.',
    completeText: 'PERMISSION SET',
    complete: false,
  },
  {
    title: 'Create your GRAVE spam box',
    completeText: 'ADDRESS: ',
    complete: false,
  },
  {
    title: 'Link GRAVE to your 🆙',
    completeText: `GRAVE LINKED`,
    complete: false,
  },
  {
    title: 'Enable GRAVE to keep assets inventory',
    completeText: `INVENTORY TRACKED`,
    complete: false,
  },
  {
    title: 'Direct all 🆙 spam to the GRAVE',
    completeText: `SPAM IS DEAD`,
    complete: false,
  },
];

const JoinGravePannel: React.FC = () => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');
  const [steps, setSteps] = React.useState([...initialSteps]);

  const displayTruncatedAddress = (address: string) => {
    return `${address.substring(0, 5)}...${address.substring(
      address.length - 4
    )}`;
  };

  /**
   * Update the data in the steps according to the step number
   *
   * Notes:
   * - If complete, display a checkmark
   * - If not complete, display a number
   * - If active, display a number
   * - If not complete and there are instructions, display instructions
   * - If complete, display completeText
   */
  const handleNewStep = (newStep: number, data: any) => {
    console.log('new step', newStep, data);
    let modifiedSteps = [...initialSteps];

    if (newStep < 0 || newStep > 5) {
      console.error('Invalid step');
      return;
    }

    // Special case for step 0
    if (newStep === 0 && data[0] && modifiedSteps[0].instructions2) {
      const address = `(${displayTruncatedAddress(data[0])})`;
      if (!modifiedSteps[0].instructions2.includes(address)) {
        modifiedSteps[0].instructions2 += address;
      }
    }

    for (let step = 0; step < modifiedSteps.length; step++) {
      if (step < newStep) {
        modifiedSteps[step].complete = true;

        // Special handling for step 1
        if (step === 1 && newStep > 1 && data[1]) {
          const address1 = displayTruncatedAddress(data[1]);
          if (!modifiedSteps[1].completeText.includes(address1)) {
            modifiedSteps[1].completeText += address1;
          }
        }
      } else {
        modifiedSteps[step].complete = false;
        // Reset completeText for steps after newStep, if needed
      }
    }

    setSteps(modifiedSteps);
    setActiveStep(newStep);
  };

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  return (
    <VStack
      spacing={4}
      p={5}
      backgroundColor={bgColor}
      boxShadow="md"
      borderRadius="lg"
      width="500px"
      textAlign="center"
      padding="20px"
      h="430px"
      color={useColorModeValue('black', 'black')}
    >
      <Text fontSize="2xl" fontWeight="bold" fontFamily="Montserrat">
        SET UP YOUR GRAVE SPAM BOX
      </Text>
      <JoinGraveBtn onJoiningStepChange={handleNewStep} />
      <Stepper
        index={activeStep}
        orientation="vertical"
        height="200px"
        gap="1"
        id="grave-step-indicator"
      >
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator
              color="dark.purple.500"
              borderColor="dark.purple.500"
            >
              <StepStatus
                complete={'🪦'}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <Box flexShrink="0" textAlign={'left'}>
              <StepTitle style={{ color: 'dark.purple.500' }}>
                {step.title}
              </StepTitle>
              {!step.complete ? (
                <Box>
                  <Box>{step.instructions}</Box>
                  <Box>{step.instructions2}</Box>
                </Box>
              ) : (
                <StepDescription>
                  <Flex alignItems="center" gap={1}>
                    {step.completeText}{' '}
                    {step.complete ? <FaCheckCircle /> : <></>}
                  </Flex>
                </StepDescription>
              )}
            </Box>
            <StepSeparator
              style={{
                color: 'dark.purple.500',
                backgroundColor: 'dark.purple.500',
              }}
            />
          </Step>
        ))}
      </Stepper>
    </VStack>
  );
};

export default JoinGravePannel;
