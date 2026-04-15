<template>
  <el-dialog
    :model-value="visible"
    title="导出Excel"
    width="400px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
    draggable
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="导出页数">
        <el-select v-model="form.pageMode" placeholder="请选择导出范围">
          <el-option label="全部数据" value="all" />
          <el-option label="当前页" value="current" />
          <el-option label="指定页数" value="custom" />
        </el-select>
      </el-form-item>
      
      <el-form-item v-if="form.pageMode === 'custom'" label="起始页码">
        <el-input-number
          v-model="form.startPage"
          :min="1"
          :max="maxPage"
          style="width: 100%;"
        />
      </el-form-item>
      
      <el-form-item v-if="form.pageMode === 'custom'" label="结束页码">
        <el-input-number
          v-model="form.endPage"
          :min="form.startPage || 1"
          :max="maxPage"
          style="width: 100%;"
        />
      </el-form-item>
      
      <el-form-item label="导出文件名">
        <el-input v-model="form.filename" placeholder="请输入文件名" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose(false)">取消</el-button>
      <el-button type="primary" @click="handleExport" :loading="exporting">
        {{ exporting ? '导出中...' : '确定导出' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { exportMultiplePagesToExcel } from '@/utils/excelExport';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  columns: {
    type: Array,
    default: () => []
  },
  fetchPageData: {
    type: Function,
    required: true
  },
  defaultFilename: {
    type: String,
    default: 'export'
  }
});

const emit = defineEmits(['update:visible', 'close']);

const exporting = ref(false);
const maxPage = computed(() => Math.ceil(props.total / props.pageSize) || 1);

const form = reactive({
  pageMode: 'all',
  startPage: 1,
  endPage: maxPage.value,
  filename: props.defaultFilename
});

const handleClose = (val) => {
  emit('update:visible', val);
  if (!val) {
    emit('close');
  }
};

const handleExport = async () => {
  let pagesToExport = [];
  
  if (form.pageMode === 'all') {
    pagesToExport = Array.from({ length: maxPage.value }, (_, i) => i + 1);
  } else if (form.pageMode === 'current') {
    pagesToExport = [1];
  } else if (form.pageMode === 'custom') {
    if (!form.startPage || !form.endPage) {
      ElMessage.error('请填写起始页码和结束页码');
      return;
    }
    if (form.startPage > form.endPage) {
      ElMessage.error('起始页码不能大于结束页码');
      return;
    }
    pagesToExport = Array.from({ length: form.endPage - form.startPage + 1 }, (_, i) => form.startPage + i);
  }
  
  exporting.value = true;
  
  try {
    const fetchData = async (page, size) => {
      const res = await props.fetchPageData(page, size);
      return res;
    };
    
    await exportMultiplePagesToExcel(fetchData, props.columns, pagesToExport.length, props.pageSize, form.filename || props.defaultFilename);
    ElMessage.success('导出成功');
    handleClose(false);
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
  }
};
</script>