<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="title"
    width="600px"
    :before-close="handleClose"
  >
    <el-form :model="searchForm" ref="formRef" label-width="120px">
      <el-form-item 
        v-for="field in searchFields" 
        :key="field.prop"
        :label="field.label" 
        :prop="field.prop"
      >
        <el-input 
          v-if="field.type === 'input'"
          v-model="searchForm[field.prop]" 
          :placeholder="field.placeholder" 
          clearable
        />
        <el-select 
          v-else-if="field.type === 'select'"
          v-model="searchForm[field.prop]" 
          :placeholder="field.placeholder" 
          style="width: 100%;"
          clearable
        >
          <el-option 
            v-for="item in field.options" 
            :key="item[field.optionValue || 'value']"
            :label="item[field.optionLabel || 'label']" 
            :value="item[field.optionValue || 'value']" 
          />
        </el-select>
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="searchForm[field.prop]"
          :type="field.dateType || 'date'"
          :placeholder="field.placeholder"
          style="width: 100%;"
          :value-format="field.valueFormat || 'YYYY-MM-DD'"
        />
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="searchForm[field.prop]" 
          :min="field.min" 
          :max="field.max"
          :precision="field.precision" 
          style="width: 100%;" 
          placeholder="请输入"
        />
        <el-select 
          v-else-if="field.type === 'boolean'"
          v-model="searchForm[field.prop]" 
          :placeholder="field.placeholder" 
          style="width: 100%;"
          clearable
        >
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleReset">清空条件</el-button>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '高级搜索'
  },
  searchFields: {
    type: Array,
    default: () => []
  },
  defaultForm: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'search'])

const formRef = ref(null)
const searchForm = ref({})

const initForm = () => {
  searchForm.value = {}
  props.searchFields.forEach(field => {
    searchForm.value[field.prop] = props.defaultForm[field.prop] || ''
  })
}

watch(() => props.visible, (val) => {
  if (val) {
    initForm()
  }
})

const handleReset = () => {
  initForm()
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSearch = () => {
  const params = {}
  Object.keys(searchForm.value).forEach(key => {
    const value = searchForm.value[key]
    if (value !== '' && value !== null && value !== undefined) {
      params[key] = value
    }
  })
  emit('search', params)
  emit('update:visible', false)
}
</script>
