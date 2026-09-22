"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectBoxStatus = void 0;
const vscode = __importStar(require("vscode"));
class ProjectBoxStatus {
    constructor(statusBarItem) {
        this.statusBarItem = statusBarItem;
        this.update();
        this.statusBarItem.show();
    }
    update() {
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        if (!vscode.workspace.getConfiguration('devspace').get('categorizeProjects')) {
            this.statusBarItem.text = `$(devspace-project-container) ${projects ? projects.length : 0}`;
            this.statusBarItem.tooltip = `Click to open Project Box | ${projects ? projects.length : 0}`;
        }
        else {
            const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
            this.statusBarItem.text = `$(devspace-project-container) ${categories ? categories.length : 0}: ${projects ? projects.length : 0}`;
            if (categories) {
                let projectCategory = "";
                for (const category of categories) {
                    if (projectCategory) {
                        projectCategory += `, ${category}: ${projects ? projects.filter(project => project.category === category).length : 0}`;
                    }
                    else {
                        projectCategory = `${category}: ${projects ? projects.filter(project => project.category === category).length : 0}`;
                    }
                }
                this.statusBarItem.tooltip = `Click to open Project Box | ${projectCategory}`;
            }
        }
        this.statusBarItem.command = 'devspace.showProjectBox';
    }
}
exports.ProjectBoxStatus = ProjectBoxStatus;
//# sourceMappingURL=ProjectBoxStatus.js.map