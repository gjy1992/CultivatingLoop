import { defineStore } from 'pinia';
export const useLogStore = defineStore('log', {
    state: () => ({
        logs: [] as string[],  // 存储日志
    }),

    actions: {
        // 添加日志
        addLog(logMessage: string) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });

            this.logs.unshift(`[${timeStr}] ${logMessage}`);

            if (this.logs.length > 30) {
                this.logs.pop(); // 只保留最近 30 条
            }
        },

        // 清空日志
        clearLogs() {
            this.logs = [];
        },
    }
}
)