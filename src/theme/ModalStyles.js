import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalContent: {
    backgroundColor: '#F7FAFF', // Very subtle light blue background
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    backgroundColor: '#EBF5FF', // Lighter blue that complements the app's color scheme
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    marginBottom: 24,
    marginHorizontal: -20,
    marginTop: -20,
    borderBottomWidth: 1,
    borderBottomColor: '#BEE3F8',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C5282', // Darker blue for better contrast with the light blue background
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  modalHeaderText: {
    color: '#3182CE', // Matches the new blue theme
    fontSize: 16,
  },
  modalHeaderSubtitle: {
    color: '#4299E1', // Lighter blue for the subtitle
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
    height: 50,
    borderWidth: 1,
    borderColor: '#BEE3F8', // Updated to match our blue theme
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    backgroundColor: '#FFFFFF', // Pure white for better contrast with the light blue modal background
    width: '100%',
    alignSelf: 'stretch',
    zIndex: 1,
    position: 'relative',
    marginBottom: 30,
    textAlign: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
    paddingBottom: 5,
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 120,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
    letterSpacing: 0.3,
  },
  editButton: {
    backgroundColor: '#4299E1', // Updated to match our blue theme
  },
  deleteButton: {
    backgroundColor: '#EF4444', // Keep red for delete actions
  },
  applyButton: {
    backgroundColor: '#3B82F6', // Blue for apply button to match app's primary color
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  saveButton: {
    backgroundColor: '#3B82F6', // Blue for save button to match app's primary color
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  cancelButton: {
    backgroundColor: '#94A3B8', // Lighter gray for cancel
    borderWidth: 1,
    borderColor: '#7F8EA3',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#3182CE', // Updated to match our blue theme
    marginBottom: 28,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 24,
    letterSpacing: 0.2,
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