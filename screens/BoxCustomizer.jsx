import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { carrierBoxes } from '../packing_algo/carrierBoxes';
import { getScale } from '../utils/boxSizes';
import Box from '../packing_algo/Box';
import Item from '../packing_algo/Item';
import { createDisplay, fitItem, checkDimensions, pack } from '../packing_algo/packing';

const carrierData = [
  { label: 'No Carrier', value: 'No Carrier' },
  { label: 'UPS', value: 'UPS' },
  { label: 'USPS', value: 'USPS' },
  { label: 'FedEx', value: 'FedEx' },
];

const BoxCustomizer = ({ navigation }) => {
  const [boxType, setBoxType] = useState('predefined'); // 'predefined' or 'custom'
  const [selectedCarrier, setSelectedCarrier] = useState('No Carrier');
  const [selectedBox, setSelectedBox] = useState(null);
  const [customDimensions, setCustomDimensions] = useState({
    length: '',
    width: '',
    height: '',
  });
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    length: '',
    width: '',
    height: '',
  });
  const [boxVolume, setBoxVolume] = useState(0);
  const [usedVolume, setUsedVolume] = useState(0);
  const [scene, setScene] = useState(null);
  const [cube, setCube] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [gl, setGl] = useState(null);

  // Get available boxes based on selected carrier
  const availableBoxes = carrierBoxes(selectedCarrier);

  const validateBoxDimensions = (dimensions) => {
    const { length, width, height } = dimensions;
    return !isNaN(length) && !isNaN(width) && !isNaN(height) &&
           length > 0 && width > 0 && height > 0;
  };

  const validateItemDimensions = (item) => {
    const { length, width, height } = item;
    if (!validateBoxDimensions({ length, width, height })) {
      Alert.alert('Invalid Dimensions', 'Please enter valid dimensions for the item.');
      return false;
    }
    
    const box = boxType === 'predefined' ? selectedBox : 
      [Number(customDimensions.length), Number(customDimensions.width), Number(customDimensions.height)];
    
    if (!box) {
      Alert.alert('No Box Selected', 'Please select or create a box first.');
      return false;
    }

    // Check if item fits in the box
    if (length > box[0] || width > box[1] || height > box[2]) {
      Alert.alert('Item Too Large', 'The item dimensions exceed the box dimensions.');
      return false;
    }

    return true;
  };

  const calculateVolume = (l, w, h) => l * w * h;

  const addItem = () => {
    if (!currentItem.length || !currentItem.width || !currentItem.height) {
      Alert.alert('Error', 'Please enter all dimensions for the item.');
      return;
    }

    // Validate that dimensions are numbers
    const length = Number(currentItem.length);
    const width = Number(currentItem.width);
    const height = Number(currentItem.height);

    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert('Error', 'Dimensions must be valid numbers.');
      return;
    }

    // Get current box
    const box = getBoxForRendering();
    if (!box) {
      Alert.alert('Error', 'Please select a box first.');
      return;
    }

    // Create test array with current items plus new item
    const testItems = [
      ...items.map((item, index) => ({
        itemLength: Number(item.length),
        itemWidth: Number(item.width),
        itemHeight: Number(item.height),
        id: item.name || `Item ${index + 1}`,
        replicatedNames: [item.name || `Item ${index + 1}`]
      })),
      {
        itemLength: length,
        itemWidth: width,
        itemHeight: height,
        id: currentItem.name || `Item ${items.length + 1}`,
        replicatedNames: [currentItem.name || `Item ${items.length + 1}`]
      }
    ];

    // Convert to format expected by pack function
    const itemsForPacking = testItems.flatMap(item => 
      item.replicatedNames.map(name => [
        item.itemLength,
        item.itemWidth,
        item.itemHeight,
        item.id,
        '',
        name
      ])
    );

    // Try to pack all items including new one
    const boxDimensions = [[box.x, box.y, box.z, box.type, box.priceText]];
    const packedBox = pack(itemsForPacking, 'No Carrier', boxDimensions);
    
    if (!packedBox) {
      Alert.alert('Box Full', 'This item would not fit in the box. Please select a larger box.');
      return;
    }

    // Calculate new item volume for tracking
    const itemVolume = calculateVolume(length, width, height);
    const newUsedVolume = usedVolume + itemVolume;

    // If packing succeeded, add the item
    setItems([...items, {
      length: length,
      width: width,
      height: height,
      name: currentItem.name || `Item ${items.length + 1}`
    }]);
    setUsedVolume(newUsedVolume);
    setCurrentItem({ length: '', width: '', height: '', name: '' });
  };

  const updateBoxDisplay = () => {
    if (!scene || !gl) return;

    const box = getBoxForRendering();
    if (!box) return;

    // Remove old cube from scene if it exists
    if (cube) {
      scene.remove(cube);
    }

    try {
      // Create new cube with box dimensions
      const newCube = createBoxMesh(box, box.scale);

      // Convert items to format expected by pack function
      const itemsForPacking = items.flatMap(item => ([
        [Number(item.length),
        Number(item.width),
        Number(item.height),
        item.name || 'Unnamed Item',
        '',
        item.name || 'Unnamed Item']
      ]));

      // Pack the items into the box
      const boxDimensions = [[box.x, box.y, box.z, box.type, box.priceText]];
      const packedBox = pack(itemsForPacking, 'No Carrier', boxDimensions);
      
      if (packedBox) {
        const displayItems = createDisplay(packedBox, box.scale);
        console.log('Display items:', displayItems);

        if (displayItems && displayItems.length > 0) {
          displayItems.forEach(item => {
            if (item.dis) {
              newCube.add(item.dis);
            }
          });
        }
      }

      scene.add(newCube);
      setCube(newCube);

      // Render the scene
      if (renderer && camera) {
        renderer.render(scene, camera);
        gl.endFrameEXP();
      }
    } catch (error) {
      console.error('Error updating box display:', error);
    }
  };

  useEffect(() => {
    updateBoxDisplay();
  }, [items, boxType, selectedBox, customDimensions]);

  useEffect(() => {
    if (boxType === 'predefined' && selectedBox) {
      const volume = calculateVolume(selectedBox[0], selectedBox[1], selectedBox[2]);
      setBoxVolume(volume);
      setUsedVolume(0); // Reset used volume when box changes
      setItems([]); // Clear items when box changes
    } else if (boxType === 'custom' && validateBoxDimensions(customDimensions)) {
      const volume = calculateVolume(
        Number(customDimensions.length),
        Number(customDimensions.width),
        Number(customDimensions.height)
      );
      setBoxVolume(volume);
      setUsedVolume(0); // Reset used volume when box changes
      setItems([]); // Clear items when box changes
    }
  }, [boxType, selectedBox, customDimensions]);

  useEffect(() => {
    if (items.length > 0 && scene && gl) {
      updateBoxDisplay();
    }
  }, [items, scene, gl, selectedBox]);

  const getBoxForRendering = () => {
    if (boxType === 'predefined' && selectedBox) {
      const scale = getScale({
        x: selectedBox[0],
        y: selectedBox[1],
        z: selectedBox[2]
      });

      return {
        x: Number(selectedBox[0]),
        y: Number(selectedBox[1]),
        z: Number(selectedBox[2]),
        type: selectedBox[3] || 'Custom Box',
        priceText: selectedBox[4] || '',
        scale: scale
      };
    } else if (boxType === 'custom' && validateBoxDimensions(customDimensions)) {
      const scale = getScale({
        x: Number(customDimensions.length),
        y: Number(customDimensions.width),
        z: Number(customDimensions.height)
      });

      return {
        x: Number(customDimensions.length),
        y: Number(customDimensions.width),
        z: Number(customDimensions.height),
        type: 'Custom Box',
        priceText: '',
        scale: scale
      };
    }
    return null;
  };

  const setupScene = () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 20, 10);
    scene.add(directionalLight);

    return scene;
  };

  const createBoxMesh = (box, scale) => {
    const geometry = new THREE.BoxGeometry(
      box.x / scale,
      box.y / scale,
      box.z / scale
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    const cube = new THREE.Mesh(geometry, material);

    // Add wireframe
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    cube.add(wireframe);

    return cube;
  };

  const renderBox = () => {
    const box = getBoxForRendering();
    console.log('Box for rendering:', box);
    if (!box) {
      console.log('No box to render');
      return null;
    }

    return (
      <View style={styles.previewContainer}>
        <GLView
          style={{ width: '100%', height: '100%' }}
          onContextCreate={async (gl) => {
            const newScene = setupScene();
            const newCamera = new THREE.PerspectiveCamera(
              75,
              gl.drawingBufferWidth / gl.drawingBufferHeight,
              0.1,
              1000
            );
            newCamera.position.set(-1.2, 0.5, 5);
            newCamera.lookAt(0, 0, 0);

            const newRenderer = new Renderer({ gl });
            newRenderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

            // Create initial box mesh
            const newCube = createBoxMesh(box, box.scale);
            newScene.add(newCube);

            // Store references
            setScene(newScene);
            setCube(newCube);
            setCamera(newCamera);
            setRenderer(newRenderer);
            setGl(gl);

            const animate = () => {
              requestAnimationFrame(animate);
              if (newRenderer && newCamera && newScene) {
                newRenderer.render(newScene, newCamera);
                gl.endFrameEXP();
              }
            };
            animate();

            // Initial display update
            updateBoxDisplay();
          }}
        />
      </View>
    );
  };

  const isBoxSelected = (box) => {
    if (!selectedBox || !box) return false;
    return box[0] === selectedBox[0] && 
           box[1] === selectedBox[1] && 
           box[2] === selectedBox[2] && 
           box[3] === selectedBox[3];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Box Type</Text>
        </View>
        <View style={styles.boxTypeContainer}>
          <TouchableOpacity
            style={[styles.boxTypeButton, boxType === 'predefined' && styles.selectedButton]}
            onPress={() => setBoxType('predefined')}
          >
            <Text style={styles.buttonText}>Predefined Box</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boxTypeButton, boxType === 'custom' && styles.selectedButton]}
            onPress={() => setBoxType('custom')}
          >
            <Text style={styles.buttonText}>Custom Box</Text>
          </TouchableOpacity>
        </View>
      </View>

      {boxType === 'predefined' ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Carrier</Text>
          </View>
          <Dropdown
            style={styles.dropdown}
            data={carrierData}
            labelField="label"
            valueField="value"
            value={selectedCarrier}
            onChange={item => {
              setSelectedCarrier(item.value);
              setSelectedBox(null);
            }}
          />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Box Size</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableBoxes.map((box, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.boxOption,
                  isBoxSelected(box) && styles.selectedBoxOption
                ]}
                onPress={() => setSelectedBox(box)}
              >
                <Text style={[
                  styles.boxDimensions,
                  isBoxSelected(box) && styles.selectedBoxDimensions
                ]}>{`${box[0]}" × ${box[1]}" × ${box[2]}"`}</Text>
                <Text style={[
                  styles.boxType,
                  isBoxSelected(box) && styles.selectedBoxType
                ]}>{box[3]}</Text>
                <Text style={[
                  styles.boxPrice,
                  isBoxSelected(box) && styles.selectedBoxPrice
                ]}>{box[4]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Custom Box Dimensions</Text>
          </View>
          <View style={styles.dimensionsContainer}>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Length</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customDimensions.length}
                onChangeText={text => setCustomDimensions({...customDimensions, length: text})}
                placeholder="L"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.dimensionSeparatorContainer}>
              <Text style={styles.dimensionSeparator}>×</Text>
            </View>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Width</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customDimensions.width}
                onChangeText={text => setCustomDimensions({...customDimensions, width: text})}
                placeholder="W"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.dimensionSeparatorContainer}>
              <Text style={styles.dimensionSeparator}>×</Text>
            </View>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customDimensions.height}
                onChangeText={text => setCustomDimensions({...customDimensions, height: text})}
                placeholder="H"
                placeholderTextColor="#666666"
              />
            </View>
          </View>
        </View>
      )}

      {(selectedBox || (boxType === 'custom' && validateBoxDimensions(customDimensions))) && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add Items</Text>
            </View>
            <View style={styles.itemInputContainer}>
              <TextInput
                style={styles.itemNameInput}
                value={currentItem.name}
                onChangeText={text => setCurrentItem({...currentItem, name: text})}
                placeholder="Item Name"
                placeholderTextColor="#666666"
              />
              <View style={styles.itemDimensionsRow}>
                <View style={styles.dimensionInput}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentItem.length}
                    onChangeText={text => setCurrentItem({...currentItem, length: text})}
                    placeholder="L"
                    placeholderTextColor="#666666"
                  />
                </View>
                <Text style={styles.itemDimensionSeparator}>×</Text>
                <View style={styles.dimensionInput}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentItem.width}
                    onChangeText={text => setCurrentItem({...currentItem, width: text})}
                    placeholder="W"
                    placeholderTextColor="#666666"
                  />
                </View>
                <Text style={styles.itemDimensionSeparator}>×</Text>
                <View style={styles.dimensionInput}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentItem.height}
                    onChangeText={text => setCurrentItem({...currentItem, height: text})}
                    placeholder="H"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Text style={styles.buttonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Box Preview</Text>
            </View>
            <View style={styles.previewContainer}>
              {renderBox()}
            </View>
            <View style={styles.volumeInfo}>
              <Text style={styles.volumeText}>
                Box Volume: {boxVolume.toFixed(2)} cubic inches
              </Text>
              <Text style={styles.volumeText}>
                Used Volume: {usedVolume.toFixed(2)} cubic inches ({((usedVolume/boxVolume) * 100).toFixed(1)}%)
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  boxTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  boxTypeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dropdown: {
    height: 50,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  boxOption: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBoxOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  boxDimensions: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedBoxDimensions: {
    color: '#1565C0',
  },
  boxType: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  selectedBoxType: {
    color: '#1976D2',
    fontWeight: '500',
  },
  boxPrice: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  selectedBoxPrice: {
    color: '#1976D2',
    fontWeight: '500',
  },
  dimensionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dimensionInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  dimensionSeparatorContainer: {
    paddingBottom: 10,
    width: 20,
    alignItems: 'center',
  },
  dimensionSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
  },
  itemDimensionSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginHorizontal: 4,
    height: 40,
    textAlignVertical: 'center',
    lineHeight: 40,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333333',
  },
  itemNameInput: {
    height: 40,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#333333',
  },
  itemInputContainer: {
    marginBottom: 16,
  },
  itemDimensionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dimensionInputWithLabel: {
    flex: 1,
    marginHorizontal: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  previewContainer: {
    height: 300,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  preview: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  volumeInfo: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  volumeText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default BoxCustomizer;
