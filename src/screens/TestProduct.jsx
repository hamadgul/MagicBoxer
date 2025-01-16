import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Load local product data
const products = require('../products.json');

const TestProduct = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Search for products by name
  const searchProducts = () => {
    const results = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
    setSelectedProduct(null);
  };

  // Render each product in the list
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => setSelectedProduct(item)}
    >
      <Text style={styles.productTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Local Product Search</Text>

      {/* Search Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter product name..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <Button title="Search" onPress={searchProducts} />

      {/* Search Results */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No products found</Text>}
      />

      {/* Selected Product Details */}
      {selectedProduct && (
        <View style={styles.details}>
          <Text style={styles.detailsHeader}>Selected Product</Text>
          <Text>Name: {selectedProduct.name}</Text>
          <Text>Length: {selectedProduct.dimensions.length}</Text>
          <Text>Width: {selectedProduct.dimensions.width}</Text>
          <Text>Height: {selectedProduct.dimensions.height}</Text>
        </View>
      )}
    </View>
  );
};

export default TestProduct;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
  productItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  productTitle: { fontSize: 16 },
  details: { marginTop: 20 },
  detailsHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});
