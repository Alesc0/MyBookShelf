import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon, CloseIcon } from '@/components/ui/icon';
import React from 'react';
import { addBook } from '@/db/books';

type Props = {
  isOpen: boolean;
  onClose?: () => void;
  setShowModal: (set: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'full';
};

export default function AppModal({ isOpen, onClose, setShowModal, size = 'md' }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose?.();
      }}
      size={size}
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Modal Title</Heading>
          <ModalCloseButton onPress={() => setShowModal(false)}>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <Text>This is the modal body. You can add any content here.</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            className="mr-3"
            onPress={() => {
              onClose?.();
            }}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            onPress={() => {
              addBook()
            }}
          >
            <ButtonText>Save</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}