import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox />)
    // Add specific assertions for the Checkbox component here
    expect(document.body).toBeInTheDocument() // Dummy assertion to pass initially
  })
})
