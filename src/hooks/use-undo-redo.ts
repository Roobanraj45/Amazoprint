'use client';

import * as React from "react";

export const useUndoRedo = <T,>(initialState: T) => {
    const [state, _setState] = React.useState({
        past: [] as T[],
        present: initialState,
        future: [] as T[],
    });

    const transactionStartState = React.useRef<T | null>(null);

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const stateRef = React.useRef(state);
    stateRef.current = state;
    
    const set = React.useCallback((action: React.SetStateAction<T>) => {
        const newPresent = typeof action === 'function' ? (action as (prevState: T) => T)(stateRef.current.present) : action;

        if (JSON.stringify(newPresent) === JSON.stringify(stateRef.current.present)) {
            return;
        }
        
        if (transactionStartState.current) {
            _setState(s => ({ ...s, present: newPresent }));
            return;
        }

        _setState(s => ({
            past: [...s.past, s.present],
            present: newPresent,
            future: [],
        }));
    }, []);

    const undo = React.useCallback(() => {
        if (transactionStartState.current) return;
        _setState(s => {
            if (s.past.length === 0) return s;
            const previous = s.past[s.past.length - 1];
            const newPast = s.past.slice(0, s.past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [s.present, ...s.future],
            };
        });
    }, []);

    const redo = React.useCallback(() => {
        if (transactionStartState.current) return;
        _setState(s => {
            if (s.future.length === 0) return s;
            const next = s.future[0];
            const newFuture = s.future.slice(1);
            return {
                past: [...s.past, s.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);
    
    const beginTransaction = React.useCallback(() => {
        if (!transactionStartState.current) {
            transactionStartState.current = stateRef.current.present;
        }
    }, []);

    const endTransaction = React.useCallback(() => {
        if (!transactionStartState.current) return;
        
        const startState = transactionStartState.current;
        transactionStartState.current = null;
        
        if (JSON.stringify(stateRef.current.present) === JSON.stringify(startState)) {
            return;
        }
        
        if (startState !== null) {
            _setState(s => ({
                ...s,
                past: [...s.past, startState],
                future: [],
            }));
        }
    }, []);
    
    const reset = React.useCallback((newPresent: T) => {
        _setState({
            past: [],
            present: newPresent,
            future: [],
        })
    }, []);

    return { state: state.present, set, undo, redo, canUndo, canRedo, reset, beginTransaction, endTransaction };
};
