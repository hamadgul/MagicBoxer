import { StyleSheet } from 'react-native';

export const box3DStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  glView: {
    flex: 1,
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  legendButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 2,
    alignSelf: 'center',
    width: 85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  boxContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
