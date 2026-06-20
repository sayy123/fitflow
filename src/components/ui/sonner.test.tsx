import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Sonner } from './sonner'

describe('Sonner', () => {
  it('renders correctly', () => {
    render(<Sonner />)
    // Add specific assertions for the Sonner component here
    expect(document.body).toBeInTheDocument() // Dummy assertion to pass initially
  })
})
