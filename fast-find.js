/**
 * FastFind - High Performance In-Memory Search
 * Uses Inverted Indexing for O(K) search complexity instead of O(N).
 */
class FastFind {
    constructor() {
        this.data = [];
        this.indices = {
            surname: new Map(),
            year: new Map(),
            province: new Map()
        };
    }

    /**
     * Load data and build indexes
     * @param {Array<string>} data - The raw data lines
     */
    setData(data) {
        this.data = data;
        this.buildIndex();
    }

    /**
     * Build inverted indexes for Surname, Year, and Province
     */
    buildIndex() {
        console.time('BuildIndex');
        // Clear existing indexes
        this.indices.surname.clear();
        this.indices.year.clear();
        this.indices.province.clear();

        const len = this.data.length;
        for (let i = 0; i < len; i++) {
            const line = this.data[i];
            if (!line) continue;

            // 1. Index Surname (First char)
            const surname = line.charAt(0);
            this._addToIndex(this.indices.surname, surname, i);

            // Extract numbers for Year and Province
            // Find first digit
            let digitIndex = -1;
            const lineLen = line.length;
            for (let j = 0; j < lineLen; j++) {
                const code = line.charCodeAt(j);
                if (code >= 48 && code <= 57) { // 0-9
                    digitIndex = j;
                    break;
                }
            }

            if (digitIndex !== -1) {
                const numStr = line.slice(digitIndex);
                
                // 2. Index Province (First 2 digits)
                if (numStr.length >= 2) {
                    const prov = numStr.substring(0, 2);
                    this._addToIndex(this.indices.province, prov, i);
                }

                // 3. Index Year (Digits at index 6-9)
                if (numStr.length >= 10) {
                    const year = numStr.substring(6, 10);
                    this._addToIndex(this.indices.year, year, i);
                }
            }
        }
        console.timeEnd('BuildIndex');
    }

    _addToIndex(map, key, index) {
        let list = map.get(key);
        if (!list) {
            list = [];
            map.set(key, list);
        }
        list.push(index);
    }

    /**
     * Search data using criteria
     * @param {Object} criteria - { surname, year, province }
     * @returns {Array<string>} - Filtered data lines
     */
    search(criteria) {
        const { surname, year, province } = criteria;

        // If no criteria, return all
        if (!surname && !year && !province) {
            return this.data;
        }

        // Collect matching index lists
        const lists = [];

        if (surname) {
            const list = this.indices.surname.get(surname);
            if (!list) return []; // No match for this surname
            lists.push(list);
        }

        if (year) {
            const list = this.indices.year.get(year);
            if (!list) return []; // No match for this year
            lists.push(list);
        }

        if (province) {
            const list = this.indices.province.get(province);
            if (!list) return []; // No match for this province
            lists.push(list);
        }

        if (lists.length === 0) {
            // Criteria provided but no lists found (should be handled above)
            return [];
        }

        // Optimization: Sort lists by length (ascending) to intersect smallest first
        lists.sort((a, b) => a.length - b.length);

        // Intersect lists
        let resultIndices = lists[0];

        for (let i = 1; i < lists.length; i++) {
            resultIndices = this._intersectSortedArrays(resultIndices, lists[i]);
            if (resultIndices.length === 0) return [];
        }

        // Map indices back to data
        // resultIndices is already sorted because _intersectSortedArrays preserves order
        const result = new Array(resultIndices.length);
        for (let i = 0; i < resultIndices.length; i++) {
            result[i] = this.data[resultIndices[i]];
        }

        return result;
    }

    /**
     * Intersect two sorted arrays of numbers
     * @param {Array<number>} arr1 
     * @param {Array<number>} arr2 
     * @returns {Array<number>}
     */
    _intersectSortedArrays(arr1, arr2) {
        const res = [];
        let i = 0;
        let j = 0;
        const len1 = arr1.length;
        const len2 = arr2.length;

        while (i < len1 && j < len2) {
            const val1 = arr1[i];
            const val2 = arr2[j];

            if (val1 < val2) {
                i++;
            } else if (val1 > val2) {
                j++;
            } else {
                res.push(val1);
                i++;
                j++;
            }
        }
        return res;
    }
}
