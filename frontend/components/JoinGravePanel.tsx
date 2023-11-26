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
import { constants } from '@/app/constants';

const initialSteps = [
  {
    title: 'Give your 🆙 necessary permissions',
    instructions: 'Give permissions to your Browser Extension Controller.',
    instructions2: { text: 'This can also be done manually.', address: null },
    completeText: { text: 'PERMISSION SET', address: null },
    complete: false,
  },
  {
    title: 'Create your GRAVE spambox',
    completeText: { text: 'ADDRESS: ', address: null },
    complete: false,
  },
  {
    title: 'Link GRAVE to your 🆙',
    completeText: { text: 'GRAVE LINKED', address: null },
    complete: false,
  },
  {
    title: 'Enable GRAVE to keep assets inventory',
    completeText: { text: 'INVENTORY TRACKED', address: null },
    complete: false,
  },
  {
    title: 'Direct all 🆙 spam to the GRAVE',
    completeText: { text: 'SPAM IS DEAD', address: null },
    complete: false,
  },
];

const JoinGravePanel: React.FC = () => {
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
      modifiedSteps[0].instructions2.address = data[0];
    }

    for (let step = 0; step < modifiedSteps.length; step++) {
      if (step < newStep) {
        modifiedSteps[step].complete = true;

        // Special handling for step 1
        if (step === 1 && newStep > 1 && data[1]) {
          const address1 = displayTruncatedAddress(data[1]);
          modifiedSteps[1].completeText.address = data[1];
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
      p={10}
      backgroundColor={bgColor}
      boxShadow="md"
      borderRadius="lg"
      textAlign="center"
      color={'dark.purple.500'}
      width={'555px'}
      minHeight={'435px'}
    >
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        {!steps[4].complete
          ? `SET UP YOUR GRAVE SPAMBOX`
          : `YOU HAVE A GRAVE SPAMBOX!`}
      </Text>
      <JoinGraveBtn onJoiningStepChange={handleNewStep} />
      <Stepper
        index={activeStep}
        orientation="vertical"
        gap="3"
        id="grave-step-indicator"
      >
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator
              color="var(--chakra-colors-dark-purple-500)"
              borderColor="var(--chakra-colors-dark-purple-500)"
              fontWeight={'bold'}
            >
              <StepStatus
                complete={'🪦'}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <Box flexShrink="0" textAlign={'left'}>
              <StepTitle
                style={{
                  color: 'var(--chakra-colors-dark-purple-500)',
                  fontWeight: 'bold',
                  width: '435px',
                }}
              >
                {step.title}
              </StepTitle>
              {!step.complete ? (
                <Box>
                  <Box>{step.instructions}</Box>
                  {step.instructions2 && step.instructions2.address && (
                    <Flex>
                      <Box mr="2px">{step.instructions2.text}</Box>
                      <a
                        href={`${constants.LUKSO_TESTNET_EXPLORER}/address/${step.instructions2.address}`}
                        style={{ textDecoration: 'underline' }}
                        target="_blank"
                      >
                        ({displayTruncatedAddress(step.instructions2.address)})
                      </a>
                    </Flex>
                  )}
                </Box>
              ) : (
                <StepDescription>
                  <Flex alignItems="center" gap={1}>
                    {step.completeText.text}
                    {step.completeText.address && (
                      <a
                        href={`${constants.LUKSO_TESTNET_EXPLORER}/address/${step.completeText.address}`}
                        style={{ textDecoration: 'underline' }}
                        target="_blank"
                      >
                        {displayTruncatedAddress(step.completeText.address)}
                      </a>
                    )}
                    {step.complete ? <FaCheckCircle /> : <></>}
                  </Flex>
                </StepDescription>
              )}
            </Box>
            <StepSeparator
              style={{
                color: 'var(--chakra-colors-dark-purple-500)',
                backgroundColor: 'var(--chakra-colors-dark-purple-500)',
              }}
            />
          </Step>
        ))}
      </Stepper>
    </VStack>
  );
};

export default JoinGravePanel;
