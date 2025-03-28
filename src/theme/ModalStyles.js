import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: '#E2E8F0', // Updated to match the item card background color
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    marginBottom: 20,
    marginHorizontal: -20,
    marginTop: -20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B', // Matches the item name text color
    textAlign: 'center',
  },
  modalHeaderText: {
    color: '#64748B', // Matches the item name text color
    fontSize: 16,
  },
  modalHeaderSubtitle: {
    color: '#64748B', // Matches the item name text color
    fontSize: 14,
    opacity: 0.9,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 15,
  },
  bulletText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#4B5563',
  },
  boldText: {
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginRight: 10,
  },
  fieldValue: {
    flex: 2,
    fontSize: 16,
    color: '#1F2937',
  },
  fieldInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    width: '100%',
    alignSelf: 'stretch',
    zIndex: 1,
    position: 'relative',
    marginBottom: 35,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    //paddingTop: 10,
    //marginTop: 5,
    paddingBottom: 0,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: 'white',
  },
  editButton: {
    backgroundColor: '#64748B', // Medium-light gray to match modal header
  },
  deleteButton: {
    backgroundColor: '#EF4444', // Keep red for delete actions
  },
  applyButton: {
    backgroundColor: '#475569', // Slightly darker gray for apply button
  },
  saveButton: {
    backgroundColor: '#475569', // Slightly darker gray for save button
  },
  cancelButton: {
    backgroundColor: '#94A3B8', // Lighter gray for cancel
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'left',
  },
});