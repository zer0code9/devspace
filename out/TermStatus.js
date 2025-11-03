"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermStatus = void 0;
class TermStatus {
    constructor(statusBarItem, termPadProvider) {
        this.statusBarItem = statusBarItem;
        this.termPadProvider = termPadProvider;
        this.update();
        this.statusBarItem.show();
    }
    async update() {
        let data = await this.getData();
        this.statusBarItem.text = `$(devspace-gear) ${data[0]} $(devspace-checkmark) ${data[1]}`;
        this.statusBarItem.command = 'devspace.termPad.focus';
        this.statusBarItem.tooltip = (data[0] + data[1]) ? `Issues: ${data[0] + data[1]}` : `No issues`;
    }
    async getData() {
        let fixme = 0;
        let todo = 0;
        const files = await this.termPadProvider.getFiles();
        for (const file of files) {
            const terms = await this.termPadProvider.getTerms(file.info);
            for (const term of terms)
                if (term.title.includes('FIXME:'))
                    ++fixme;
                else if (term.title.includes('TODO:'))
                    ++todo;
        }
        return [fixme, todo];
    }
}
exports.TermStatus = TermStatus;
//# sourceMappingURL=TermStatus.js.map