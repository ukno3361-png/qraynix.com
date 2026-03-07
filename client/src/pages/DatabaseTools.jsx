import React, { useCallback, useEffect, useState } from 'react';
import { dbTools } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function DatabaseTools() {
    const toast = useToast();
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    const [sourceFile, setSourceFile] = useState('');
    const [targetFile, setTargetFile] = useState('qraynix.migrated.db');
    const [overwrite, setOverwrite] = useState(false);
    const [inPlaceFile, setInPlaceFile] = useState('');
    const [backupBeforeMigrate, setBackupBeforeMigrate] = useState(true);
    const [result, setResult] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [statusData, filesData] = await Promise.all([
                dbTools.status(),
                dbTools.files(),
            ]);
            setStatus(statusData);
            const list = filesData.files || [];
            setFiles(list);
            if (!sourceFile && statusData?.currentDbFile) {
                setSourceFile(statusData.currentDbFile);
            }
            if (!inPlaceFile && statusData?.currentDbFile) {
                setInPlaceFile(statusData.currentDbFile);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to load DB tools data');
        } finally {
            setLoading(false);
        }
    }, [inPlaceFile, sourceFile, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const runCloneMigrate = async () => {
        if (!sourceFile || !targetFile) {
            toast.error('Source and target filenames are required');
            return;
        }

        setRunning(true);
        setResult(null);
        try {
            const data = await dbTools.cloneMigrate({ sourceFile, targetFile, overwrite });
            setResult(data);
            toast.success('Clone + migrate completed');
            await load();
        } catch (err) {
            toast.error(err.message || 'Clone + migrate failed');
        } finally {
            setRunning(false);
        }
    };

    const runMigrateInPlace = async () => {
        if (!inPlaceFile) {
            toast.error('Select a database file to migrate');
            return;
        }

        setRunning(true);
        setResult(null);
        try {
            const data = await dbTools.migrateInPlace({
                targetFile: inPlaceFile,
                createBackup: backupBeforeMigrate,
            });
            setResult(data);
            toast.success('In-place migration completed');
            await load();
        } catch (err) {
            toast.error(err.message || 'In-place migration failed');
        } finally {
            setRunning(false);
        }
    };

    if (loading) {
        return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Database Tools</h1>
                <button className="btn btn-ghost" onClick={load}>Refresh</button>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Current Runtime DB</h3>
                <p style={{ marginBottom: '0.4rem' }}><strong>Current file:</strong> {status?.currentDbFile}</p>
                <p style={{ margin: 0 }}><strong>Data dir:</strong> <code>{status?.dataDir}</code></p>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Migrate Existing DB In Place (Recommended)</h3>
                <p style={{ color: 'var(--text-faint)' }}>
                    Adds new tables/columns to the existing database file without wiping your data.
                </p>

                <div className="form-group">
                    <label className="form-label">DB File</label>
                    <select className="form-input" value={inPlaceFile} onChange={(e) => setInPlaceFile(e.target.value)}>
                        <option value="">Select a DB file</option>
                        {files.map((f) => (
                            <option key={f.name} value={f.name}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="toggle-row">
                        <input
                            type="checkbox"
                            checked={backupBeforeMigrate}
                            onChange={(e) => setBackupBeforeMigrate(e.target.checked)}
                        />
                        <span>Create timestamped backup before migration</span>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={runMigrateInPlace} disabled={running}>
                        {running ? 'Running...' : 'Run In-Place Migration'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Clone Old DB -&gt; New DB + Run Migrations</h3>
                <p style={{ color: 'var(--text-faint)' }}>
                    This does not modify your source DB file. It copies source into target, then applies all pending migrations to the target.
                </p>

                <div className="form-group">
                    <label className="form-label">Source DB File</label>
                    <select className="form-input" value={sourceFile} onChange={(e) => setSourceFile(e.target.value)}>
                        <option value="">Select a source file</option>
                        {files.map((f) => (
                            <option key={f.name} value={f.name}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Target DB File</label>
                    <input
                        className="form-input"
                        value={targetFile}
                        onChange={(e) => setTargetFile(e.target.value)}
                        placeholder="example: qraynix.new.db"
                    />
                </div>

                <div className="form-group">
                    <label className="toggle-row">
                        <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                        <span>Overwrite target if it already exists</span>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={runCloneMigrate} disabled={running}>
                        {running ? 'Running...' : 'Run Clone + Migrate'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Detected .db Files</h3>
                {files.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-faint)' }}>No database files found.</p>
                ) : (
                    <div className="table-scroll">
                        <table className="data-table entries-table">
                            <thead>
                                <tr>
                                    <th>File</th>
                                    <th>Size</th>
                                    <th>Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((f) => (
                                    <tr key={f.name}>
                                        <td>{f.name}</td>
                                        <td>{Math.round((f.sizeBytes || 0) / 1024)} KB</td>
                                        <td>{new Date(f.modifiedAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {result && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Last Run Result</h3>
                    <p><strong>Status:</strong> Success</p>
                    {result.sourceFile && <p><strong>Source:</strong> <code>{result.sourceFile}</code></p>}
                    <p><strong>Target:</strong> <code>{result.targetFile}</code></p>
                    {result.backupFile && <p><strong>Backup:</strong> <code>{result.backupFile}</code></p>}
                    {result.suggestedEnv && <p><strong>Set in .env next:</strong> <code>{result.suggestedEnv}</code></p>}
                    <p style={{ marginBottom: 0, color: 'var(--text-faint)' }}>{result.message}</p>
                </div>
            )}
        </div>
    );
}
