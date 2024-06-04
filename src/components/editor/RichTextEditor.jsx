import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.css';

const RichTextEditor = ({ content, setContent }) => {
    const quillRef = useRef(null);
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video',
        'align', 'color', 'background', 'script',
        'table', 'code-block'
    ];

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['blockquote', 'code-block'],
            ['clean'],
            [{ 'table': true }]
        ],
        clipboard: {
            matchVisual: false,
        }
    };

    useEffect(() => {
        if (quillRef.current) {
            const toolbar = quillRef.current.getEditor().getModule('toolbar').container;
            toolbar.classList.add(styles.qlToolbar);

            const container = quillRef.current.getEditor().container;
            container.classList.add(styles.qlContainer);

            const editor = quillRef.current.getEditor().scroll.domNode;
            editor.classList.add(styles.qlEditor);
        }
    }, []);

    return (
        <Quill
            ref={quillRef}
            theme="snow"
            modules={modules}
            formats={formats}
            value={content}
            onChange={setContent}
        />
    );
};

export default RichTextEditor;
