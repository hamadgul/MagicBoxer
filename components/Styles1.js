// styles.js
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfd",
    padding: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333", // Darker text for better readability
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd", // Light border color
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#3498db", // Blue button color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  visualizeButton: {
    //flex: 1,
    backgroundColor: "#2ecc71", // Green button color
    paddingVertical: 10,
    paddingHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    width: "96%",
  },
  buttonContainer: {
    padding: 10,
    backgroundColor: "#fdfdfd",
    alignItems: "center", // Center the content inside this container
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap", // Allows items to wrap to the next line
    justifyContent: "flex-start",
    alignItems: "flex-start", // Align items to the top of the row
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, // Shadow for Android
  },
  button: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOpen: {
    backgroundColor: "#e74c3c", // Red color for "Delete" button
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
  },
  buttonClose: {
    backgroundColor: "orange", // Orange color for "Close" button
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
  },
  buttonDelete: {
    backgroundColor: "#e74c3c", // Red color for "Delete" button
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
  },
  modalButtonContainer: {
    flexDirection: "row", // Ensure buttons are in a row
    flexWrap: "wrap", // Allow wrapping if there are many buttons
    justifyContent: "flex-start", // Align buttons to the start of the container
    alignItems: "center",
    marginTop: 20,
  },
  itemButton: {
    padding: 10,
    borderRadius: 5,
    margin: 4, // Reduced margin to allow four items per line
    justifyContent: "center",
    alignItems: "center",
    width: "22%", // Set width to slightly less than 25% to account for margins
    minWidth: 75, // Ensure items have a consistent size
    maxWidth: 75, // Set maximum width for consistency
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd", // Matching input style
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    marginBottom: 16,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  container1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  buttonText: {
    color: "#fff", // White text color for contrast
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Shadow for Android
  },
  itemsContainer: {
    flexShrink: 1, // Shrinks the container when space is limited
    flexGrow: 0, // Doesn't grow when empty
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 5,
    minHeight: 50, // Minimum height when no items are present
  },
  carrierContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10, // Reduced horizontal padding
    paddingVertical: 6, // Reduced vertical padding to keep height minimal
    borderRadius: 8, // Slightly rounded corners for visual distinction
    marginVertical: 1, // Small vertical margin for spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow offset for a lighter effect
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Lower elevation for a subtler shadow
    borderColor: "#ddd",
    borderWidth: 1, // Light border for distinction without adding bulk
  },
});

export default styles;
