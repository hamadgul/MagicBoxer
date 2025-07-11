// styles.js

import { StyleSheet, Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get('window');

// Device-agnostic responsive scaling
// Instead of using a single reference device (iPhone 8), we use breakpoints
// to determine appropriate scaling for different device sizes
const getResponsiveScale = () => {
  const shortestDimension = Math.min(width, height);
  
  // Breakpoints for different device sizes
  if (shortestDimension <= 320) { // Small phones (iPhone SE 1st gen, etc)
    return 0.85;
  } else if (shortestDimension <= 350) { // Medium-small phones
    return 0.9;
  } else if (shortestDimension <= 400) { // Medium phones (iPhone X, 11, etc)
    return 1.0; // Base scale
  } else if (shortestDimension <= 480) { // Large phones (iPhone Plus models, etc)
    return 1.05;
  } else if (shortestDimension <= 768) { // Small tablets
    return 1.1;
  } else { // Large tablets
    return 1.15;
  }
};

const scale = getResponsiveScale();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16 * scale,
    paddingTop: 16 * scale,
    paddingBottom: 16 * scale,
  },
  label: {
    fontSize: 14 * scale,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 2 * scale,
  },
  condensedLabel: {
    marginBottom: 1 * scale,
    fontSize: 13 * scale,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    height: 42 * scale,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 8 * scale,
    backgroundColor: '#F8FAFC',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    color: '#334155',
    fontSize: 15 * scale,
  },
  condensedInput: {
    height: 40 * scale,
    marginBottom: 8 * scale,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 8 * scale,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    color: '#334155',
    fontSize: 14 * scale,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5 * scale,
    paddingTop: 5 * scale,
  },
  submitButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 12 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8 * scale,
    width: "100%",
  },
  visualizeButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5 * scale,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savePackageButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0066FF",
    width: "48%",
  },
  packButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 12 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5 * scale,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 15 * scale,
    fontWeight: "600",
    textAlign: 'center',
    letterSpacing: 0.2, // Added letter spacing for better readability
    flexShrink: 1, // Allow text to shrink if needed
  },
  savePackageButtonText: {
    color: "#0066FF",
    fontSize: 16 * scale,
    fontWeight: "600",
  },
  itemButton: {
    backgroundColor: '#E2E8F0', // Slightly darker gray background
    paddingVertical: 8 * scale,
    paddingHorizontal: 15 * scale,
    borderRadius: 10 * scale,
    marginVertical: 4 * scale,
    marginHorizontal: 10 * scale,
    height: 46 * scale,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    width: '95%',
  },
  horizontalItemButton: {
    backgroundColor: '#E2E8F0', // Slightly darker gray background
    padding: 12 * scale, // Slightly increased padding
    borderRadius: 12 * scale, // Increased border radius for a softer look
    marginHorizontal: 6 * scale,
    height: 100 * scale,
    width: 160 * scale,
    shadowColor: "#64748B", // Changed shadow color to match text
    shadowOffset: {
      width: 0,
      height: 2, // Slightly increased shadow height
    },
    shadowOpacity: 0.15, // Slightly increased shadow opacity
    shadowRadius: 5, // Increased shadow radius for a softer shadow
    elevation: 3, // Slightly increased elevation
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Added subtle border
    borderColor: '#CBD5E1', // Light gray border
  },
  horizontalItemContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  horizontalItemIndex: {
    fontSize: 16 * scale,
    fontWeight: "700",
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    width: 30 * scale,
    height: 30 * scale,
    borderRadius: 15 * scale,
    textAlign: 'center',
    lineHeight: 30 * scale,
    marginBottom: 5 * scale,
  },
  horizontalItemNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6 * scale,
    paddingVertical: 6 * scale,
    flex: 1,
    marginBottom: 6 * scale,
    position: 'relative',
    minHeight: 40 * scale,
  },
  itemCountContainer: {
    position: 'absolute',
    right: 5 * scale,
    top: 5 * scale,
    backgroundColor: '#4A5568',
    borderRadius: 10 * scale,
    width: 20 * scale,
    height: 20 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 10,
    elevation: 5,
  },
  itemCount: {
    fontSize: 10 * scale,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  horizontalItemDimensions: {
    marginTop: 5 * scale,
    backgroundColor: '#D1D9E6', // Slightly different shade for contrast
    paddingHorizontal: 10 * scale, // Increased padding
    paddingVertical: 4 * scale, // Increased padding
    borderRadius: 8 * scale, // Increased border radius
    borderWidth: 1, // Added subtle border
    borderColor: '#CBD5E1', // Light gray border
  },
  dimensionText: {
    fontSize: 12 * scale,
    color: '#64748B',
    fontWeight: '600', // Slightly bolder font
    letterSpacing: 0.3, // Added letter spacing for better readability
  },
  itemIndex: {
    fontSize: 14 * scale,
    fontWeight: "600",
    marginRight: 8 * scale,
    width: 28 * scale,
    textAlign: 'left',
    color: '#1E3A8A',
  },
  carouselContainer: {
    paddingVertical: 10 * scale,
    paddingHorizontal: 5 * scale,
  },
  horizontalCarouselContainer: {
    paddingVertical: 10 * scale,
    paddingHorizontal: 10 * scale,
    alignItems: 'center',
  },
  totalItemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8 * scale,
    paddingVertical: 4 * scale,
  },
  totalItemsText: {
    color: '#3B82F6',
    fontSize: 13 * scale,
    fontWeight: '600',
    marginLeft: 4 * scale,
  },
  clearItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8 * scale,
    paddingVertical: 4 * scale,
    marginRight: 8 * scale,
  },
  clearItemsText: {
    color: '#EF4444',
    fontSize: 13 * scale,
    fontWeight: '600',
    marginLeft: 4 * scale,
  },
  itemsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12 * scale,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8 * scale,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingVertical: 8 * scale,
  },
  formContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16 * scale,
    paddingVertical: 16 * scale,
    borderRadius: 10 * scale,
    marginTop: 0,
    marginBottom: 6 * scale,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contentContainer: {
    height: 150 * scale,
    marginBottom: 10 * scale,
  },
  horizontalContentContainer: {
    minHeight: 140 * scale,
    marginBottom: 20 * scale,
  },
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: '#fff',
    marginTop: -12 * scale,
    paddingBottom: 20 * scale,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20 * scale,
    padding: 20 * scale,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18 * scale,
    fontWeight: "700",
    color: "#64748B", // Updated to match the item name text color
    marginBottom: 15 * scale,
    textAlign: "center",
    width: "100%",
    letterSpacing: 0.3,
  },
  buttonApply: {
    backgroundColor: "#10B981",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    marginVertical: 5 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonApply1: {
    backgroundColor: "#10B981",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 10 * scale,
    marginVertical: 10 * scale,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonClose: {
    backgroundColor: "#F59E0B",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5 * scale,
    width: "38%",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonClose1: {
    backgroundColor: "#EF4444",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    marginVertical: 5 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDelete: {
    backgroundColor: "#EF4444",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    marginHorizontal: 5 * scale,
    width: "30%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonEdit: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 8 * scale,
    alignItems: "center",
    marginHorizontal: 5 * scale,
    width: "30%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 35 * scale,
    marginBottom: 15 * scale,
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingHorizontal: 8 * scale,
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8 * scale,
    padding: 16 * scale,
    marginVertical: 8 * scale,
    marginHorizontal: 16 * scale,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemContentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  itemNameContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  itemText: {
    fontSize: 16 * scale,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 6 * scale,
    textAlign: "left",
    paddingHorizontal: 6 * scale,
    letterSpacing: 0.2,
  },
  itemDimensions: {
    fontSize: 14 * scale,
    color: "#636e72",
    marginBottom: 4 * scale,
    textAlign: "left",
    paddingHorizontal: 6 * scale,
    letterSpacing: 0.1,
  },
  dimensionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12 * scale,
    paddingHorizontal: 4 * scale,
  },
  fieldContainer: {
    marginBottom: 12 * scale,
    width: '100%',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20 * scale,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16 * scale,
    textAlign: 'center',
    marginBottom: 10 * scale,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 15 * scale,
    textAlign: 'center',
    opacity: 0.9,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25 * scale,
  },
});

export default styles;